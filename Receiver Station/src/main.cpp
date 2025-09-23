#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <WiFiClientSecure.h>
#include <LittleFS.h>
#include <LoRa.h>
#include <SPI.h>
#include <Arduino.h>
#include <PubSubClient.h>
#include <EEPROM.h>
#include <ArduinoJson.h>
#include <Ticker.h>

#define DEVICEID 1000

// Initialize a state machine
enum STATES
{
    INIT_STATE,
    BROADCAST_STATE,
    REQ_STATE,
    RX_STATE
};

STATES current_state = INIT_STATE;

// Currently Request device Id
uint16_t reqDeviceId = 0;
uint16_t prevDeviceId = 0;
bool dataReceived = false;
#define REQ_RETRIES 3

// Receiver Zone Id
char zoneId[4];
char expectedZoneIdTopic[64];
bool zoneIdReceived = false;

// Broadcast Time
struct TimePacket
{
    uint32_t unixTime;
    uint16_t millis;
};

TimePacket packet;
bool broadcast = false;
uint8_t sync_retries = 0;
int retries;
bool allowRequest = false;

// Configuration Settings
char expectedConfigTopic[64];

struct DeviceConfig
{
    int timeInterval;
    int totalCollars;
    uint16_t allocatedTime;
};

DeviceConfig config = {180, 5, 36};

bool configReceived = false;
size_t sync_status_size;
uint8_t *sync_status;
uint8_t *ack_status;

#define CS 15      // Chip select
#define RESET 14   // Reset
#define DIO0 4     // DIO0
#define FREQ 433E6 // Setup Frequency

// Wi-Fi Credentials
#define SSID_ADDR 0
#define PASS_ADDR 32
#define MAX_SSID_LEN 32
#define MAX_PASS_LEN 32

char ssid[32] = "ssid";
char pass[32] = "pass";

// AWS End-point
const char *awsEndpoint = "aoowqlrrhcw8y-ats.iot.eu-north-1.amazonaws.com";

// Paths in LittleFS
const char *cert = "/certificate.pem.crt";
const char *key = "/private.pem.key";
const char *ca = "/AmazonRootCA1.pem";

// SSL
BearSSL::X509List *caCert;
BearSSL::X509List *clientCert;
BearSSL::PrivateKey *clientKey;

WiFiClientSecure secureClient;
PubSubClient mqttClient(secureClient);
ESP8266WebServer server(80);
Ticker hourlyTicker;
Ticker reqTicker;

// Function Declaration
void connectAWS();
String readFile(const char *);
void connectToWiFi(void);
void getWiFiCredentials(void);
void saveWiFiCredentials(const char *, const char *);
void startAP(void);
void handleSave(void);
void handleRoot(void);
void broadcastTime(void);
void reqNext(void);
void mqttCallback(char *, byte *, unsigned int);
void getStationConfig(void);
void handleConfig(const char *);
void waitForConfig(void);
void getZoneId(void);
void handleZoneId(const char *);
void waitForZoneId(void);

// Setup
void setup()
{
    EEPROM.begin(128);

    /**
     * Un-commment to Write WiFi Credentials to EEPROM
     * For the first time only */

    // EEPROM.put(0,ssid);
    // EEPROM.commit();

    // EEPROM.put(32,pass);
    // EEPROM.commit();

    Serial.begin(9600);
    delay(1000); // Time for serial to initialze

    // Debugging
    while (!Serial)
        ;

    // Already Saved credentials
    getWiFiCredentials();

    // Initialize the WiFi connection
    connectToWiFi();

    configTime(0, 0, "0.amazon.pool.ntp.org", "pool.ntp.org"); // Sync time via NTP
    delay(2000);                                               // Wait for sync

    // Initialize LiffeFS
    if (!LittleFS.begin())
    {
        Serial.println("Failed to start LittleFS");
        return;
    }

    // Connecting to AWS
    connectAWS();

    // Find out zone Id for current device ID
    snprintf(expectedZoneIdTopic, sizeof(expectedZoneIdTopic), "device/%d/zone", DEVICEID);
    getZoneId();
    waitForZoneId();

    // Subcribe to configuration settings
    snprintf(expectedConfigTopic, sizeof(expectedConfigTopic), "station/%s/config", zoneId);
    getStationConfig();
    waitForConfig();

    // Setup using the received config
    sync_status_size = (config.totalCollars + 7) / 8;
    sync_status = (uint8_t *)calloc(sync_status_size, sizeof(uint8_t));
    ack_status = (uint8_t *)calloc(sync_status_size, sizeof(uint8_t));

    Serial.println("Initializing LoRa");
    LoRa.setPins(15, 14, 4);

    if (!LoRa.begin(FREQ))
    {
        Serial.println("Starting LoRa failed!");
        while (1)
            ;
    }

    Serial.println("LoRa Initialized Successfully");

    // Attach Ticker to Broadcast Time hourly
    hourlyTicker.attach(config.timeInterval, broadcastTime);
    Serial.println("Attached Hourly Ticker");

    // Attach Ticker to update retry and request logic
    Serial.println("Attached RequestTime Ticker");
    reqTicker.attach((config.allocatedTime / REQ_RETRIES), reqNext);
}

// Broadcast the time
void broadcastTime()
{
    time_t lastSecond = time(nullptr);
    unsigned long int lastMillis = 0;

    // Wait for a second to elapse to calculate millis
    time_t now;
    while (lastSecond == time(nullptr))
    {
        lastMillis = millis();
        now = time(nullptr);
        delay(1);
    }

    long milliseconds = (millis() - lastMillis) % 1000;

    // Format: "YYYY-MM-DD HH:MM:SS.mmm"
    packet.unixTime = now;
    packet.millis = milliseconds;
    broadcast = true;
    sync_retries = 0;
    reqDeviceId = 0;
    prevDeviceId = 0;

    if (sync_status != NULL)
    {
        free(sync_status);
        sync_status = (uint8_t *)calloc(sync_status_size, sizeof(uint8_t));
    }

    if (ack_status != NULL)
    {
        free(ack_status);
        ack_status = (uint8_t *)calloc(sync_status_size, sizeof(uint8_t));
    }
}

void reqNext()
{
    Serial.printf("Retry: %d\n", retries);
    if (reqDeviceId == config.totalCollars)
    {
        return;
    }

    if (retries == 0)
    {
        while (!(sync_status[reqDeviceId / 8] & (1 << (reqDeviceId % 8))))
        {
            reqDeviceId++;
            if (reqDeviceId == config.totalCollars)
                break;
        }

        dataReceived = false;
        Serial.printf("\nUpdating device Id: %d\n", (int)reqDeviceId);
    }

    retries = (retries + 1) % REQ_RETRIES; // wrap around REQ_RETRIES
    allowRequest = true;
}

// Utility to load a file into a String
String readFile(const char *path)
{
    File file = LittleFS.open(path, "r");
    if (!file)
    {
        Serial.printf("Failed to open %s\n", path);
        return "";
    }
    String content = file.readString();
    file.close();
    return content;
}

// Retrieve WiFi credentials from EEPROM
void getWiFiCredentials(void)
{
    EEPROM.get(0, ssid);
    // ssid[sizeof(ssid) - 1] = '\0'; // Force null-termination

    EEPROM.get(32, pass);
    // ssid[sizeof(pass) - 1] = '\0'; // Force null-termination
}

// Save WiFi Credentials to EEPROM
void saveWiFiCredentials(const char *ssidToSave, const char *passToSave)
{
    // Clear both sections first
    for (int i = 0; i < MAX_SSID_LEN; i++)
        EEPROM.write(SSID_ADDR + i, 0);
    for (int i = 0; i < MAX_PASS_LEN; i++)
        EEPROM.write(PASS_ADDR + i, 0);

    // Safe write SSID
    int ssidLen = strlen(ssidToSave);
    if (ssidLen >= MAX_SSID_LEN)
        ssidLen = MAX_SSID_LEN - 1;
    for (int i = 0; i < ssidLen; i++)
    {
        EEPROM.write(SSID_ADDR + i, ssidToSave[i]);
    }
    EEPROM.write(SSID_ADDR + ssidLen, '\0');

    // Safe write Password
    int passLen = strlen(passToSave);
    if (passLen >= MAX_PASS_LEN)
        passLen = MAX_PASS_LEN - 1;
    for (int i = 0; i < passLen; i++)
    {
        EEPROM.write(PASS_ADDR + i, passToSave[i]);
    }
    EEPROM.write(PASS_ADDR + passLen, '\0');

    EEPROM.commit();
}

// Connect to WiFi
void connectToWiFi()
{
    int retries = 0;

    WiFi.begin(ssid, pass);

    while (WiFi.status() != WL_CONNECTED)
    {
        if (retries++ >= 60)
        { // 30 seconds total (60 x 500ms)
            Serial.println("Failed to connect - starting AP");

            Serial.print("SSID: ");
            Serial.println(ssid);

            Serial.print("Pass: ");
            Serial.println(pass);

            startAP(); // This will never return
            return;
        }
        delay(500);
        Serial.print(".");
    }

    Serial.println("\nConnected to WiFi!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
}

// Start simple Access Point
void startAP()
{
    Serial.println("\nStarting Access Point...");
    WiFi.disconnect();
    WiFi.mode(WIFI_AP);
    WiFi.softAP("Station0", "cms123");

    IPAddress IP = WiFi.softAPIP();
    Serial.print("AP IP address: ");
    Serial.println(IP);

    server.on("/", handleRoot);
    server.on("/save", handleSave);
    server.begin();

    while (true)
    {
        server.handleClient();
        delay(10);
    }
}

// Handle Root
void handleRoot()
{
    String html = "<html><body><h1>Setup WiFi</h1>";
    html += "<form action='/save' method='get'>";
    html += "SSID: <input type='text' name='ssid'><br>";
    html += "Password: <input type='password' name='pass'><br>";
    html += "<input type='submit' value='Save'>";
    html += "</form></body></html>";
    server.send(200, "text/html", html);
}

// Handle logic to save to EEPROM
void handleSave()
{
    String newSSID = server.arg("ssid");
    String newPASS = server.arg("pass");

    // Validate input lengths
    if (newSSID.length() >= MAX_SSID_LEN || newPASS.length() >= MAX_PASS_LEN)
    {
        server.send(400, "text/plain", "Error: Credentials too long");
        return;
    }

    newSSID.toCharArray(ssid, sizeof(ssid));
    newPASS.toCharArray(pass, sizeof(pass));

    saveWiFiCredentials(ssid, pass);

    String response = "<html><body><h1>Saved. Rebooting...</h1></body></html>";
    server.send(200, "text/html", response);
    delay(3000);
    ESP.restart(); // Reboot to try connecting
}

// Connect to AWS
void connectAWS()
{
    caCert = new BearSSL::X509List(readFile(ca).c_str());
    clientCert = new BearSSL::X509List(readFile(cert).c_str());
    clientKey = new BearSSL::PrivateKey(readFile(key).c_str());

    // Set device certificate and key
    secureClient.setTrustAnchors(caCert);
    secureClient.setClientRSACert(clientCert, clientKey);

    mqttClient.setServer(awsEndpoint, 8883);
    mqttClient.setKeepAlive(60);
    mqttClient.setCallback(mqttCallback);

    while (!mqttClient.connected())
    {
        Serial.println("Connecting to AWS IoT...");
        if (mqttClient.connect("Station"))
        {
            Serial.println("Connected to AWS IoT!");
            mqttClient.publish("esp8266/test", "Hello from ESP8266!");
        }
        else
        {
            Serial.print("SSL Error: ");
            Serial.println(secureClient.getLastSSLError());
            Serial.print("Failed: ");
            Serial.println(mqttClient.state());
            delay(3000);
        }
    }
}

void publishAWS(const char *id, const char *payload)
{
    // Prepare the topic
    char topic[64];
    snprintf(topic, sizeof(topic), "zone/%s/cattle%s/data", zoneId, id);
    if (mqttClient.publish(topic, payload))
    {
        Serial.print("Message published to topic: ");
        Serial.println(topic);
    }
    else
    {
        Serial.println("Failed to publish message.");
    };
}

void mqttCallback(char *topic, byte *payload, unsigned int length)
{
    Serial.print("Message received on topic: ");
    Serial.println(topic);

    String message;
    for (unsigned int i = 0; i < length; i++)
    {
        message += (char)payload[i];
    }

    if (strcmp(topic, expectedConfigTopic) == 0)
    {
        handleConfig(message.c_str());
        configReceived = true;
    }
    else if (strcmp(topic, expectedZoneIdTopic) == 0)
    {
        handleZoneId(message.c_str());
        zoneIdReceived = true;
    }
}

void getZoneId()
{
    if (mqttClient.subscribe(expectedZoneIdTopic))
    {
        Serial.print("Subscribed to topic: ");
        Serial.println(expectedZoneIdTopic);
    }
    else
    {
        Serial.println("Failed to subscribe to station config");
    }
}

void waitForZoneId()
{
    zoneIdReceived = false; // Reset the flag

    unsigned long start = millis();
    unsigned long timeout = 10000; // 10 seconds

    while (!zoneIdReceived && ((millis() - start) < timeout))
    {
        mqttClient.loop();
        delay(100);
    }

    if (!zoneIdReceived)
    {
        char errorTopic[64];
        char payload[64];

        snprintf(errorTopic, sizeof(errorTopic), "device/%d/error", DEVICEID);
        snprintf(payload, sizeof(payload), "Zone Id not found for device id: %d", DEVICEID);
        mqttClient.publish(errorTopic, payload);
    }
}

void handleZoneId(const char *message)
{
    JsonDocument doc;
    DeserializationError error = deserializeJson(doc, message);

    if (error)
    {
        Serial.println("Failed to parse JSON");
        return;
    }

    const char *id = doc["zoneId"];
    if (id != nullptr)
    {
        strncpy(zoneId, id, sizeof(zoneId) - 1);
        zoneId[sizeof(zoneId) - 1] = '\0'; // Ensure null-termination

        Serial.print("Zone Id: ");
        Serial.println(zoneId);
    }
    else
    {
        Serial.println("zoneId field missing or null");
    }
}

void getStationConfig()
{
    if (mqttClient.subscribe(expectedConfigTopic))
    {
        Serial.print("Subscribed to topic: ");
        Serial.println(expectedConfigTopic);
    }
    else
    {
        Serial.println("Failed to subscribe to station config");
    }
}

void waitForConfig()
{
    configReceived = false; // Reset the flag

    unsigned long start = millis();
    unsigned long timeout = 10000; // 10 seconds

    while (!configReceived && ((millis() - start) < timeout))
    {
        mqttClient.loop();
        delay(100);
    }

    if (!configReceived)
    {
        char errorTopic[64];
        char payload[64];

        snprintf(errorTopic, sizeof(errorTopic), "station/%c/error", *zoneId);
        snprintf(payload, sizeof(payload), "Error in retreving config file at receiver station (id: %c)", *zoneId);
        mqttClient.publish(errorTopic, payload);
    }
}

void handleConfig(const char *message)
{
    JsonDocument doc;
    deserializeJson(doc, message);

    config.timeInterval = doc["timeInterval"];
    config.allocatedTime = doc["allocatedTime"];
    config.totalCollars = doc["totalCollars"];

    Serial.print("time Interval: ");
    Serial.println(config.timeInterval);
    Serial.print("allocated Time: ");
    Serial.println(config.allocatedTime);
    Serial.print("total Collars: ");
    Serial.println(config.totalCollars);
}

void loop()
{
    switch (current_state)
    {
    case INIT_STATE:
        broadcastTime();
        current_state = BROADCAST_STATE;
        break;

    case BROADCAST_STATE:
    {
        uint8_t mode = 0xA0;
        if (broadcast && sync_retries < 5)
        {
            Serial.printf("Retry #%d\n", sync_retries);
            LoRa.beginPacket();
            LoRa.write((uint8_t *)&mode, 1); // Broadcast header
            LoRa.write((uint8_t *)&packet, sizeof(packet));
            LoRa.write((uint8_t *)&config.allocatedTime, sizeof(config.allocatedTime));
            LoRa.write(&sync_retries, 1);
            LoRa.write(sync_status, sync_status_size); // Broadcasting sync status mask
            if (LoRa.endPacket())
            {
                // Serial.printf("Broadcast: %d.%d, Allocated Time: %d\n", packet.unixTime, packet.millis, (int)allocatedTime);
                Serial.print("Status mask: ");

                for (int i = 0; i < sync_status_size; i++)
                {
                    Serial.printf("%02X ", sync_status[i]);
                    Serial.flush();
                }

                Serial.println("");
            }

            uint8_t buffer[256];
            // Listen to Acks
            unsigned long start = millis();
            int recvdAcks = 0;
            while (millis() - start < 1000)
            {
                int packetSize = LoRa.parsePacket();
                yield();
                if (packetSize > 0)
                {
                    while (LoRa.available() >= 2 && recvdAcks < 256)
                    {
                        uint8_t highByte = LoRa.read();
                        uint8_t lowByte = LoRa.read();
                        if (lowByte == 0xAA)
                        {
                            buffer[recvdAcks++] = highByte;
                        }
                        Serial.printf("RX: Ack : 0x%02X\n", buffer[recvdAcks - 1]);
                    }

                    for (size_t i = 0; i < recvdAcks; i++)
                    {
                        uint8_t byteMask = buffer[i] / 8;
                        uint8_t bitMask = buffer[i] % 8;

                        sync_status[byteMask] |= (1 << bitMask);
                    }
                }
            }

            sync_retries++;
            break;
        }

        // Update state to RX_STATE
        broadcast = false;
        current_state = REQ_STATE;
        reqNext();
        break;
    }

    case REQ_STATE:
    {
        uint8_t mode = 0xB0;

        if (!mqttClient.connected())
        {
            connectAWS();
        }
        mqttClient.loop();

        if (broadcast)
        {
            current_state = BROADCAST_STATE;
            allowRequest = false;
            break;
        }

        if (allowRequest)
        {
            LoRa.beginPacket();
            LoRa.write((uint8_t *)&mode, 1);
            LoRa.write((uint8_t *)&reqDeviceId, 2);
            LoRa.write((uint8_t *)&retries, 1);
            LoRa.write(ack_status, sync_status_size); // Broadcasting ack status mask
            if (LoRa.endPacket())
            {
                Serial.printf("Requesting from device id: %d mode: %X\n", (int)reqDeviceId, (int)mode);
            }
            else
            {
                Serial.print("Request failed");
            }

            // Update State to RX_STATE
            allowRequest = false;
            current_state = RX_STATE;
        }
        break;
    }

    case RX_STATE:

        // Try to parse packet
        int packetSize = LoRa.parsePacket();
        yield();
        if (packetSize)
        {
            // Received a packet
            Serial.print("Received packet: ");

            char msg[64];
            // read Packet
            int i = 0;
            while (LoRa.available())
            {
                msg[i++] = (char)LoRa.read();
                if ((size_t)i >= sizeof(msg) - 1)
                {
                    break; // Prevent buffer overflow
                }
            }

            msg[i] = '\0';

            DynamicJsonDocument doc(64);

            // Deserialize the JSON message
            DeserializationError error = deserializeJson(doc, msg);

            if (error)
            {
                Serial.print("Failed to deserialize JSON: ");
                Serial.println(error.f_str());
                return;
            }

            const char *id = doc["i"];

            Serial.print("Received From : ");
            Serial.print(id);

            // Printing RSSI of packet
            Serial.print("' with RSSI '");
            Serial.println(LoRa.packetRssi());

            if ((atoi(id) == reqDeviceId) && !dataReceived)
            {
                // Publish to AWS IoT
                publishAWS(id, msg);
                uint8_t byteMask = reqDeviceId / 8;
                uint8_t bitMask = reqDeviceId % 8;
                ack_status[byteMask] |= (1 << bitMask);
                Serial.printf("Device Id: %d is Recorded\n", atoi(id));
                dataReceived = true;
                break;
            }
        }

        if (!allowRequest)
        {
            // Serial.print(".");
            break;
        }

        Serial.printf("Retrying.... device Id: %d\n", (int)reqDeviceId);
        // Update the Current state
        current_state = REQ_STATE;
        break;
    }
}
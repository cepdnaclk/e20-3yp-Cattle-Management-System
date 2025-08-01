/*
TinyGPS - a small GPS library for Arduino providing basic NMEA parsing
Based on work by and "distance_to" and "course_to" courtesy of Maarten Lamers.
Suggestion to add satellites(), course_to(), and cardinal(), by Matt Monson.
Copyright (C) 2008-2012 Mikal Hart
All rights reserved.

This library is free software; you can redistribute it and/or
modify it under the terms of the GNU Lesser General Public
License as published by the Free Software Foundation; either
version 2.1 of the License, or (at your option) any later version.

This library is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public
License along with this library; if not, write to the Free Software
Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/
#include <stdbool.h>

#ifndef tinygps_h
#define tinygps_h

#define false 0
#define true 1

#define PI 3.14159265
#define TWO_PI 2*PI

#define sq(x) ((x)*(x))

#define GPRMC_TERM   "GPRMC"
#define GPGGA_TERM   "GPGGA"

#define GPS_INVALID_F_ANGLE 1000.0
#define GPS_INVALID_F_ALTITUDE 1000000.0
#define GPS_INVALID_F_SPEED -1.0


#define GPS_VERSION 12 // software version of this library
#define GPS_MPH_PER_KNOT 1.15077945
#define GPS_MPS_PER_KNOT 0.51444444
#define GPS_KMPH_PER_KNOT 1.852
#define GPS_MILES_PER_METER 0.00062137112
#define GPS_KM_PER_METER 0.001
// #define GPS_NO_STATS

  enum {
    GPS_INVALID_AGE = 0xFFFFFFFF,
    GPS_INVALID_ANGLE = 999999999, 
    GPS_INVALID_ALTITUDE = 999999999,
    GPS_INVALID_DATE = 0,
    GPS_INVALID_TIME = 0xFFFFFFFF,
    GPS_INVALID_SPEED = 999999999, 
    GPS_INVALID_FIX_TIME = 0xFFFFFFFF,
    GPS_INVALID_SATELLITES = 0xFF,
    GPS_INVALID_HDOP = 0xFFFFFFFF
  };

  // process one character received from GPS
  bool gps_encode(char c);

  // lat/long in hundred thousandths of a degree and age of fix in milliseconds
  void gps_get_position(long *latitude, long *longitude, unsigned long *fix_age);

  // date as ddmmyy, time as hhmmsscc, and age in milliseconds
  void gps_get_datetime(unsigned long *date, unsigned long *time, unsigned long *age);

  void gps_f_get_position(float *latitude, float *longitude, unsigned long *fix_age);
  void gps_crack_datetime(int *year, uint8_t *month, uint8_t *day, 
    uint8_t *hour, uint8_t *minute, uint8_t *second, uint8_t *hundredths, unsigned long *fix_age);
  float gps_f_altitude();
  float gps_f_course();
  float gps_f_speed_knots();
  float gps_f_speed_mph();
  float gps_f_speed_mps();
  float gps_f_speed_kmph();
  
#ifndef GPS_NO_STATS
  void gps_stats(unsigned long *chars, unsigned short *good_sentences, unsigned short *failed_cs);
#endif

  enum {
	GPS_SENTENCE_GPGGA,
	GPS_SENTENCE_GPRMC,
	GPS_SENTENCE_OTHER
  };

  // internal utilities
  int from_hex(char a);
  unsigned long gps_parse_decimal();
  unsigned long gps_parse_degrees();
  bool gps_term_complete();
  bool gpsisdigit(char c);
  long gpsatol(const char *str);
  int gpsstrcmp(const char *str1, const char *str2);

#endif

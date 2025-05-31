import { useContext } from 'react';
import { FieldValue, useForm, FieldValues } from 'react-hook-form';
import { IoMdCloseCircleOutline } from 'react-icons/io';
import GlobalContext from '../../context/GlobalContext';
import { addCattle } from '../../services/CattleListService';

const AddCattleForm = () => {
  const { setShowCattleAddForm } = useContext(GlobalContext);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const closeAddCattleForm = () => {
    setShowCattleAddForm(false);
  };

  const onSubmit = async (data: FieldValues) => {
    try {
      const formatedData = {
        ...data,
        cattleId: data.cattleId,
        cattleName: data.cattleName,
        addedOn: new Date().toISOString(),
      };
      console.log(formatedData);
      const response = await addCattle(formatedData);
      console.log('Cattle added successfully: ', response.data);
      closeAddCattleForm();
    } catch (error) {
      console.error('Error adding cattle: ', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="absolute inset-0 flex justify-center items-center bg-opacity-100 backdrop-blur-lg">
        {/* Add Cattle form */}
        <div className="bg-green-600 w-96 p-7 shadow-2xl hover:scale-101 rounded-xl">
          <header className="flex justify-between items-center border-b border-white pb-3">
            <h1 className="text-xl font-semibold text-white">Add Cattle</h1>
            <button
              onClick={closeAddCattleForm}
              className="text-white text-2xl hover:text-red-600 hover:bg-white rounded-full">
              <IoMdCloseCircleOutline />
            </button>
          </header>

          {/* Cattle ID */}
          <div className="space-x-2 mt-4">
            <label className="text-lg text-white font-medium">Cattle ID</label>
            <input
              id="cattleId"
              type="string"
              {...register('cattleName')}
              placeholder="Enter cattle name"
              className="w-full border-2 bg-gray-50 border-gray-100 rounded-md p-2 mt-1 focus:ring-1 focus:ring-green-600"
            />
            {errors.cattleId?.type === 'required' && (
              <p className="text-red-600">Cattle ID field is required</p>
            )}
          </div>

          {/* Cattle Name */}
          <div className="space-x-2 mt-4">
            <label className="text-lg text-white font-medium">
              Cattle Name
            </label>
            <input className="w-full border-2 bg-gray-50 border-gray-100 rounded-md p-2 mt-1 focus:ring-1 focus:ring-green-600"></input>
          </div>
        </div>
      </div>
    </form>
  );
};

export default AddCattleForm;

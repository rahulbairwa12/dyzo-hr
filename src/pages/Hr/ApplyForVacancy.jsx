import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Textinput from '@/components/ui/Textinput';  // Adjust this import based on your file structure
import { postAPIFiles, fetchAPI } from '@/store/api/apiSlice';
import { toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router-dom';
import Textarea from '@/components/ui/Textarea';
import Checkbox from '@/components/ui/Checkbox';
import Fileinput from '@/components/ui/Fileinput';
import { Link } from 'react-router-dom';

const schema = yup.object().shape({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup.string().required('Phone number is required'),
  // resume: yup.mixed().required('Resume is required'),
  skills: yup.string().required('Skills are required'),
  total_experience: yup.string().required('Total experience is required'),
  willing_to_relocate: yup.boolean().required(),
  state: yup.string().required('State is required'),
  address: yup.string().required('Address is required'),
  education: yup.array().of(
    yup.object().shape({
      institute_name: yup.string().required('Institute name is required'),
      passing_year: yup.string().required('Passing year is required'),
      course: yup.string().required('Course is required'),
      percentage: yup.string().required('Percentage is required'),
    })
  ),
  experience: yup.array().of(
    yup.object().shape({
      organization_name: yup.string().required('Organization name is required'),
      place: yup.string().required('Place is required'),
      position: yup.string().required('Position is required'),
      start_date: yup.string().required('Start date is required'),
      end_date: yup.string().required('End date is required'),
      currently_working: yup.boolean(),
    })
  ),
});





const DateInput = ({ label, name, register, error }) => (
  <div className={`formGroup ${error ? "has-error" : ""}`}>
    {label && (
      <label htmlFor={name} className="block capitalize form-label">
        {label}
      </label>
    )}
    <div className="relative">
      <input
        type="date"
        id={name}
        {...register(name)}
        className={`form-control py-2 ${error ? 'border-red-500' : ''}`}
      />
      {error && (
        <div className={`mt-2 ${error ? "text-danger-500 block text-sm" : ""}`}>
          {error.message}
        </div>
      )}
    </div>
  </div>
);

function ApplyForVacancy() {

  const { register, control, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  });
  const navigate = useNavigate();
  let vacancyId = useParams()
  vacancyId = vacancyId.vacancyId;
  const [jobInformation, setJobInformation] = useState({});
  const [formData, setFormData] = useState({ vacancyId });
  const [file, setFile] = useState(null);


  const onFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
  };


  const { fields: educationFields, append: appendEducation, remove: removeEducation } = useFieldArray({
    control,
    name: 'education',
  });

  const { fields: experienceFields, append: appendExperience, remove: removeExperience } = useFieldArray({
    control,
    name: 'experience',
  });

  useEffect(() => {
    const getJobInfo = async () => {
      try {
        const response = await fetchAPI(`api/job/${vacancyId}`);
        if (response.status === 1) {
          setJobInformation(response?.data);
        } else {
          setErrorPathMessage(response?.response?.data?.message);
        }
      } catch (error) {
        console.error('Error fetching job information:', error);
      }
    };
    getJobInfo();
    setFormData({ vacancyId });
  }, [vacancyId]);

  // const handleFileChange = (e) => {

  //   const { name, files } = e.target;
  //   const file = files[0];
  //   const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  //   const maxSize = 2 * 1024 * 1024; // 2MB

  //   if (file) {
  //     if (!allowedTypes.includes(file.type)) {
  //       toast.error('File type must be PDF or DOCX.');
  //       return;
  //     }
  //     if (file.size > maxSize) {
  //       toast.error('File size must be less than 2MB.');
  //       return;
  //     }

  //     const reader = new FileReader();

  //     reader.onload = (event) => {
  //       const binaryStr = event.target.result;

  //       setFormData({
  //         ...formData,
  //         [name]: binaryStr,
  //       });
  //     };

  //     reader.readAsArrayBuffer(file);  // Read the file as an ArrayBuffer
  //   }
  // };


  const onSubmit = async (data) => {
    const formData = new FormData();

    try {
      const transformedData = {
        jobid: vacancyId,
        applicant_name: data.name,
        applicant_email: data.email,
        mobile_no: data.phone,
        total_experience: data.total_experience,
        is_relocate: data.willing_to_relocate,
        state: data.state,
        country: data.country,
        address: data.address,
        skills: data.skills.split(','),
        education: data.education.map(edu => ({
          institute: edu.institute_name,
          course: edu.course,
          percentage: edu.percentage,
          passingYear: edu.passing_year,
        })),
        work_experience: data.experience.map(exp => ({
          organization: exp.organization_name,
          place: exp.place,
          position: exp.position,
          startDate: exp.start_date,
          endDate: exp.end_date,
          currentlyWorking: exp.currently_working,
        })),
      };

      Object.keys(transformedData).forEach(key => {
        if (Array.isArray(transformedData[key])) {
          transformedData[key].forEach((item, index) => {
            formData.append(`${key}[${index}]`, JSON.stringify(item));
          });
        } else {
          formData.append(key, transformedData[key]);
        }
      });

      if (file) {
        formData.append('upload_resume', file);
      }


      const response = await postAPIFiles(`api/applicant-information/`, {
        body: formData,
      });

      if (response.status === 1) {
        toast.success('Application submitted successfully');
        navigate('/thank_You');
      }
    } catch (error) {
      toast.error('Error while submitting application');
      console.error('Error submitting application:', error);
    }
  };



  return (
    <div className=" mx-auto p-4">

      {jobInformation && (
        <div className="bg-gray-100 p-4 mb-6 rounded-lg shadow-md dark:bg-transparent dark:shadow-none dark:border dark:border-slate-700">
          <h2 className="text-2xl mb-3 text-center">{jobInformation.company_name}</h2>
          <p className="text-lg"><strong>Job ID:</strong> {jobInformation.job_id}</p>
          <p className="text-lg"><strong>Job Title:</strong> {jobInformation.job_title}</p>
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        <Textinput
          name="name"
          label="Name"
          register={register}
          error={errors?.name}
          placeholder="Enter your name"
          className="w-full"
        />
        <Textinput
          name="email"
          label="Email"
          register={register}
          error={errors?.email}
          placeholder="Enter your email"
          className="w-full"
        />
        <Textinput
          name="phone"
          label="Phone"
          register={register}
          error={errors?.phone}
          placeholder="Enter your phone number"
          className="w-full"
        />
        {/* <div className="w-full">
          <label className="block form-label mb-1">Upload Resume</label>
          <input
            type="file"
            name="resume"
            onChange={handleFileChange}
            {...register('resume')}
            className="w-full  form-control p-2"
          />
          {errors.resume && <p className="text-red-500">{errors.resume.message}</p>}
        </div> */}
        <p className="block capitalize form-label  ">Resume</p>
        <Fileinput onChange={onFileChange} label="upload resume" selectedFile={file}  />


        <Textinput
          name="skills"
          label="Skills"
          register={register}
          error={errors?.skills}
          placeholder="Enter your skills"
          className="w-full"
        />

        <div className="w-full bg-gray-100 p-4 rounded-lg shadow-md mb-4 dark:bg-transparent dark:shadow-none dark:border dark:border-slate-700">
          <h3 className="text-lg font-semibold mb-2">Education</h3>
          {educationFields.map((item, index) => (
            <div key={item.id} className="mb-4 space-y-2">
              <Textinput
                name={`education[${index}].institute_name`}
                label="Institute Name"
                register={register}
                error={errors?.education?.[index]?.institute_name}
                placeholder="Enter your institute name"
                className="w-full"
              />
              <Textinput
                name={`education[${index}].passing_year`}
                label="Passing Year"
                register={register}
                error={errors?.education?.[index]?.passing_year}
                placeholder="Enter your passing year"
                className="w-full"
              />
              <Textinput
                name={`education[${index}].course`}
                label="Course"
                register={register}
                error={errors?.education?.[index]?.course}
                placeholder="Enter your course"
                className="w-full"
              />
              <Textinput
                name={`education[${index}].percentage`}
                label="Percentage"
                register={register}
                error={errors?.education?.[index]?.percentage}
                placeholder="Enter your percentage"
                className="w-full"
              />
              <button type="button" onClick={() => removeEducation(index)} className="btn btn inline-flex justify-center   
        
         btn-danger light mt-4 mb-4">
                Remove Education
              </button>
            </div>
          ))}
          <button
            type="button"
            className=" btn btn-dark dark:bg-slate-800 h-min text-sm font-normal"
            onClick={() => appendEducation({ institute_name: '', passing_year: '', course: '', percentage: '' })}
          >
            Add Education
          </button>
        </div>

        <div className="w-full bg-gray-100 p-4 rounded-lg shadow-md mb-4 dark:bg-transparent dark:shadow-none dark:border dark:border-slate-700">
          <h3 className="text-lg font-semibold mb-2">Work Experience</h3>
          {experienceFields.map((item, index) => (
            <div key={item.id} className="mb-4 space-y-2">
              <Textinput
                name={`experience[${index}].organization_name`}
                label="Organization Name"
                register={register}
                error={errors?.experience?.[index]?.organization_name}
                placeholder="Enter the organization name"
                className="w-full"
              />
              <Textinput
                name={`experience[${index}].place`}
                label="Place"
                register={register}
                error={errors?.experience?.[index]?.place}
                placeholder="Enter the place"
                className="w-full"
              />
              <Textinput
                name={`experience[${index}].position`}
                label="Position"
                register={register}
                error={errors?.experience?.[index]?.position}
                placeholder="Enter your position"
                className="w-full"
              />
              <DateInput
                name={`experience[${index}].start_date`}
                label="Start Date"
                register={register}
                error={errors?.experience?.[index]?.start_date}
                placeholder="Enter the start date"
                className="w-full"
              />
              <DateInput
                name={`experience[${index}].end_date`}
                label="End Date"
                register={register}
                error={errors?.experience?.[index]?.end_date}
                placeholder="Enter the end date"
                className="w-full"
              />
              <div className="flex items-center my-6">
                <input
                  type="checkbox"
                  id={`currently_working[${index}]`}
                  {...register(`experience[${index}].currently_working`)}
                  className="mr-2"
                />
                <label htmlFor={`currently_working[${index}]`} className="text-gray-700">Currently Working</label>
              </div>
              <button type="button" onClick={() => removeExperience(index)} className="btn inline-flex justify-center   
        
         btn-danger light mt-4 mb-4">
                Remove Experience
              </button>
            </div>
          ))}
          <button
            type="button"
            className=" btn btn-dark inline-flex justify-center dark:bg-slate-800 h-min text-sm font-normal"
            onClick={() => appendExperience({ organization_name: '', place: '', position: '', start_date: '', end_date: '', currently_working: false })}
          >
            Add Work Experience
          </button>
        </div>

        <Textinput
          name="total_experience"
          label="Total Experience"
          register={register}
          error={errors?.total_experience}
          placeholder="Enter your total experience"
          className="w-full"
        />
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="willing_to_relocate"
            {...register('willing_to_relocate')}
            className="mr-2"
          />
          <label htmlFor="willing_to_relocate" className="text-gray-700 dark:text-gray-300">
            Willing to relocate?
          </label>
        </div>

        <Textinput
          name="state"
          label="State"
          register={register}
          error={errors?.state}
          placeholder="Enter your state"
          className="w-full"
        />
        <Textinput
          name="country"
          label="Country"
          register={register}
          error={errors?.state}
          placeholder="Enter your Country"
          className="w-full"
        />
        <Textarea
          name="address"
          label="address"
          register={register}
          placeholder="Enter your address"
          className="w-full "
        />
        {errors.address && <p className="text-red-500">{errors.address.message}</p>}
        <button type="submit" className="mx-auto my-6 btn btn-success flex justify-center items-center ">
          Submit Application
        </button>
      </form>
    </div>
  );
}

export default ApplyForVacancy;

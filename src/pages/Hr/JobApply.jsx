import React, { useEffect, useState } from "react";
import { fetchGET, postAPIFiles } from "@/store/api/apiSlice";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Textinput from "@/components/ui/Textinput";
import { useForm, useFieldArray } from "react-hook-form";
import Fileinput from "@/components/ui/Fileinput";
import Button from "@/components/ui/Button";
import { Icon } from "@iconify/react";

const phoneRegExp = /^((\\+[1-9]{1,4}[ \\-]*)|(\\([0-9]{2,3}\\)[ \\-]*)|([0-9]{2,4})[ \\-]*)*?[0-9]{3,4}?[ \\-]*[0-9]{3,4}?$/;

const JobApply = () => {
  const { jobid } = useParams();
  const navigate = useNavigate();
  const baseURL = import.meta.env.VITE_APP_DJANGO;

  const [vacancyData, setVacancyData] = useState();
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState("");
  const [apiLoader, setApiLoader] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm({
    defaultValues: {
      education: [{ college: "", branch: "", percentage: "" }],
      experience: [{ company: "", jobTitle: "", years: "" }],
    },
  });

  const { fields: educationFields, append: appendEducation, remove: removeEducation } = useFieldArray({
    control,
    name: "education",
  });

  const { fields: experienceFields, append: appendExperience, remove: removeExperience } = useFieldArray({
    control,
    name: "experience",
  });

  useEffect(() => {
    fetchVacancyInformation();
  }, []);

  const fetchVacancyInformation = async () => {
    try {
      const response = await fetchGET(`${baseURL}/api/job/${jobid}/`);
      if (response.status === 1) {
        setVacancyData(response.data);
      }
    } catch (error) {
      toast.error(error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    setFileError("");
  };

  const validateFile = () => {
    if (!selectedFile) {
      setFileError("File is required");
      return false;
    }
    if (selectedFile.size > 2 * 1024 * 1024) {
      setFileError("File size is too large");
      return false;
    }
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(selectedFile.type)) {
      setFileError("Unsupported file format");
      return false;
    }
    return true;
  };

  const handleSubmitForm = async (data) => {
    const completeFormData = {
      jobid: jobid,
      applicant_name: data.name,
      applicant_email: data.email,
      mobile_no: data.phone,
      upload_resume: selectedFile,
      total_experience: data.total_experience,
      state: data.state,
      country: data.country,
      address: data.address,
      skills: JSON.stringify(skills),
      education: JSON.stringify(data.education),
      work_experience: JSON.stringify(data.experience),
    };

    if (validateFile()) {
      setApiLoader(true);
      try {
        const response = await postAPIFiles(`api/applicant-information/`, {
          body: completeFormData,
        });

        if (response?.status === 1) {
          setShowModal(true);
          setTimeout(() => {
            navigate("/thankyou");
            setApiLoader(false);
          }, 3000);
        } else {
          toast.error(response.response.data.message);
          setApiLoader(false);
        }
      } catch (error) {
        toast.warning("Error: ", error);
        setApiLoader(false);
        setTimeout(() => {
          navigate("/");
        }, 800);
      }
    } else {
      toast.error("All fields are required");
    }
  };

  const addSkill = () => {
    if (skillInput.trim()) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const removeSkill = (index) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white dark:bg-black-800 p-6 rounded-lg shadow-sm h-full">
      <h3 className="text-3xl font-bold text-black-500 text-center underline capitalize"> job application form </h3>
      <p className="text-base text-black-500 text-center capitalize py-3">Please Fill Out the Form Below to Submit Your Job Application!</p>
      <p className="text-base text-black-500 text-center capitalize">{`for ${vacancyData?.job_title} at ${vacancyData?.company_name}`}</p>

      <div className="max-w-2xl m-auto">
        <form onSubmit={handleSubmit(handleSubmitForm)} className="space-y-4">
          <Textinput
            name="name"
            label="Applicant Name"
            type="text"
            register={register}
            error={errors.name}
            required
            placeholder="Enter your name"
          />
          <Textinput
            name="email"
            label="Applicant Email"
            type="email"
            register={register}
            error={errors.email}
            required
            placeholder="Enter your email"
          />
          <Textinput
            name="phone"
            label="Mobile Number"
            type="tel"
            register={register}
            error={errors.phone}
            required
            placeholder="Enter your phone number"
          />
          <Textinput
            name="total_experience"
            label="Total Experience (Years)"
            type="number"
            step="0.1"
            register={register}
            error={errors.total_experience}
            required
            placeholder="Enter your total experience"
          />
          <Textinput
            name="country"
            label="Country"
            type="text"
            register={register}
            error={errors.country}
            required
            placeholder="Enter your country"
          />

          <Textinput
            name="state"
            label="State"
            type="text"
            register={register}
            error={errors.state}
            required
            placeholder="Enter your state"
          />

          <Textinput
            name="address"
            label="Address"
            type="text"
            register={register}
            error={errors.address}
            required
            placeholder="Enter your city"
          />

          <div>
            <label htmlFor="upload_resume" className="text-sm font-medium">Upload Resume</label>
            <Fileinput
              name="upload_resume"
              onChange={handleFileChange}
              selectedFile={selectedFile}
              className={`${fileError ? "border-red-500" : ""}`}
              required
            />
            {fileError && <p className="text-red-500 text-sm">{fileError}</p>}
            <p className="text-sm font-medium text-black-400">
              Resume size must be less than 2MB and in pdf or docx format.
            </p>
          </div>

          <div className="mt-8">
            <h4 className="text-lg font-bold text-gray-700">Education Details</h4>
            {educationFields.map((item, index) => (
              <div key={item.id} className="flex items-center gap-4 mt-4">
                <Textinput
                  name={`education[${index}].college`}
                  label="College Name"
                  type="text"
                  defaultValue={item.college}
                  register={register}
                  className="flex-grow"
                  placeholder="Enter your college name"
                  required
                />
                <Textinput
                  name={`education[${index}].branch`}
                  label="Branch"
                  type="text"
                  defaultValue={item.branch}
                  register={register}
                  className="flex-grow"
                  placeholder="Enter your branch"
                  required
                />
                <Textinput
                  name={`education[${index}].percentage`}
                  label="Percentage"
                  type="number"
                  step="0.01"
                  defaultValue={item.percentage}
                  register={register}
                  className="flex-grow"
                  placeholder="Enter your percentage"
                  required
                />
                <button
                  type="button"
                  onClick={() => removeEducation(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Icon icon="heroicons-outline:trash" />
                </button>
              </div>
            ))}

            <div className='text-right'>

              <button
                type="button"
                onClick={() => appendEducation({ college: "", branch: "", percentage: "" })}
                className="btn btn-dark mt-4"
              >
                +
              </button>


            </div>

          </div>


          <div className="mt-8">
            <h4 className="text-lg font-bold text-gray-700">Work Experience</h4>
            {experienceFields.map((item, index) => (
              <div key={item.id} className="flex items-center gap-4 mt-4">
                {/* Flex layout for inputs and delete button */}
                <Textinput
                  name={`experience[${index}].company`}
                  label="Company Name"
                  type="text"
                  defaultValue={item.company}
                  register={register}
                  className="flex-grow"
                  placeholder="Enter your company name"

                />
                <Textinput
                  name={`experience[${index}].jobTitle`}
                  label="Job Title"
                  type="text"
                  defaultValue={item.jobTitle}
                  register={register}
                  className="flex-grow"
                  placeholder="Enter your job title"

                />
                <Textinput
                  name={`experience[${index}].years`}
                  label="Years of Experience"
                  type="number"
                  step="0.01"
                  defaultValue={item.years}
                  register={register}
                  className="flex-grow"
                  placeholder="Enter your years of experience"

                />

                <button
                  type="button"
                  onClick={() => removeExperience(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Icon icon="heroicons-outline:trash" />
                </button>
              </div>
            ))}
            <div className="text-right">

              <button
                type="button"
                onClick={() => appendExperience({ company: "", jobTitle: "", years: "" })}
                className="btn btn-dark mt-4"
                required
              >
                +
              </button>


            </div>

          </div>


          <div className="mt-8">
            <h4 className="text-lg font-bold text-gray-700">Skills</h4>

            <div className="relative w-full mt-4">
              <Textinput
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                className="form-input w-full"
                placeholder="Enter a skill"
                required
              />
              <button
                type="button"
                onClick={addSkill}
                className="absolute right-2 top-0 bottom-0 my-auto h-full px-4 btn btn-dark flex justify-center items-center"
              >
                Add Skill
              </button>
            </div>

            <div className="flex flex-wrap gap-3 mt-4">
              {skills.map((skill, index) => (
                <div
                  key={index}
                  className="bg-gray-200 text-black-500 rounded-full px-3 py-1 text-sm flex items-center"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => removeSkill(index)}
                    className="ml-2 text-red-500 hover:text-red-700"
                  >
                    <Icon icon="heroicons-outline:x" />
                  </button>
                </div>
              ))}
            </div>
          </div>


          <div className="ltr:text-right rtl:text-left">
            <button type="submit" className="btn btn-dark text-center">
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobApply;

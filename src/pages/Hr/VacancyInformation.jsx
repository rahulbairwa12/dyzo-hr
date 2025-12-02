import React, { useEffect, useState } from "react";
import { fetchGET } from "@/store/api/apiSlice";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import Button from "@/components/ui/Button";
import AdvancedModal from "@/components/ui/AdvancedModal";
import { Icon } from "@iconify/react";

const VacancyInformation = () => {
  const { vacancyId } = useParams();
  const navigate = useNavigate();
  const [isShareModalOpen, setIsshareModalOpen] = useState(false);
  const baseURL = import.meta.env.VITE_APP_DJANGO;
  const urlOrigin = window.location.origin;
  const [currentJobId, setCurrentJobId] = useState();
  const [vacancyData, setVacancyData] = useState();
  const [loading, setLoading] = useState(true);


  const fetchVacancyInformation = async () => {
    try {
      const response = await fetchGET(`${baseURL}/api/job/${vacancyId}/`);
      if (response.status === 1) {
        setVacancyData(response.data);
      }
    } catch (error) {
      toast.error(error);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchVacancyInformation();
  }, []);

  const openShareModal = (thisjobid) => {
    setCurrentJobId(thisjobid);
    setIsshareModalOpen(true);
  }

  return (
    <div>

      {
        loading ? (
          <div className="flex justify-center items-center h-screen">
            <Icon
              icon="eos-icons:bubble-loading"
              className="text-xl animate-spin"
            />
          </div>
        ) : (

          vacancyData ? (
            <div className="bg-white dark:bg-black-800 p-6 rounded-lg shadow-sm ">
              <div>
                {vacancyData.job_title && (
                  <h2 className="text-3xl font-bold underline text-blue-500 dark:text-blue-500 text-center">
                    {vacancyData?.job_title}
                  </h2>
                )}
              </div>
              <div className="flex justify-between items-center my-4">
                <Button
                  text="Apply Now"
                  className="btn-dark py-2 "
                  disabled={vacancyData.is_active ? false : true}
                  onClick={() => vacancyData.is_active && navigate(`/vacancy/apply/${vacancyId}`)}
                />
                <Button
                  icon="heroicons-share-solid"
                  text="Share Job"
                  className="btn-outline-dark p-2 hover:btn-dark "
                  onClick={() => openShareModal(vacancyId)}
                />
              </div>
              <div>
                {vacancyData?.company_name && (
                  <h3 className="text-lg font-bold">
                    Company Name -
                    <a href={vacancyData?.company_website_url}>
                      {vacancyData?.company_name}
                    </a>
                  </h3>
                )}
                {vacancyData?.skills && (
                  <h4 className="text-base font-semibold my-2 ">
                    Skills - {vacancyData?.skills}
                  </h4>
                )}
              </div>
              {vacancyData?.work_arrangement && (
                <h4 className="text-base font-semibold my-2">
                  Work Arrangement -{" "}
                  <span className="capitalize">
                    {vacancyData?.work_arrangement}
                  </span>
                </h4>
              )}
              {vacancyData?.employment_type && (
                <h4 className="text-base font-semibold my-2">
                  Employment Type -{" "}
                  <span className="capitalize">{vacancyData?.employment_type}</span>
                </h4>
              )}
              {vacancyData?.level && (
                <h4 className="text-base font-semibold my-2">
                  Level - <span className="capitalize">{vacancyData?.level}</span>
                </h4>
              )}
              {vacancyData?.shift && (
                <h4 className="text-base font-semibold my-2">
                  Shift - <span className="capitalize">{vacancyData?.shift}</span>
                </h4>
              )}
              {vacancyData?.pay_scale && (
                <h4 className="text-base font-semibold my-2">
                  Pay Scale -
                  <span className="capitalize">{vacancyData?.pay_scale}</span>
                </h4>
              )}

              {vacancyData?.job_role && (
                <div className="text-start py-2">
                  <h3 className="text-2xl font-semibold">Job Role</h3>
                  <div
                    className="dangerousText"
                    dangerouslySetInnerHTML={{ __html: vacancyData?.job_role }}
                  />
                </div>
              )}

              {vacancyData?.job_description && (
                <div className="text-start py-2">
                  <h3 className="text-2xl font-semibold">About the Job</h3>
                  <div
                    className="dangerousText"
                    dangerouslySetInnerHTML={{
                      __html: vacancyData?.job_description,
                    }}
                  />
                </div>
              )}
              {vacancyData?.company_website_url && (
                <div className="mb-4">
                  <h5 className="text-lg">
                    Website:-{" "}
                    <a
                      className="text-blue-400"
                      href={vacancyData?.company_website_url}
                    >
                      <span>{vacancyData?.company_website_url}</span>
                    </a>
                  </h5>
                </div>
              )}
              <div className="flex justify-end">
                <Button
                  text="Apply Now"
                  className="btn-dark py-2"
                  disabled={vacancyData.is_active ? false : true}
                  onClick={() => vacancyData.is_active && navigate(`/vacancy/apply/${vacancyId}`)}
                />
              </div>
            </div>
          ) : (
            <div className="h-[70vh] flex items-center justify-center ">
              <h2 className="text-lg font-semibold text-center text-black-500 ">
                No information found
              </h2>
            </div>
          )
        )
      }


      <AdvancedModal
        activeModal={isShareModalOpen}
        onClose={() => setIsshareModalOpen(false)}
        className="max-w-xl"
        title="Share On:"
      >
        <div className="flex justify-around">
          <a href={`https://wa.me/?text=${encodeURIComponent("Check out this job: " + `${urlOrigin}/vacancy/${currentJobId}`)}`}
            target="_blank" rel="noopener noreferrer"
            className="px-4 py-2 text-white rounded-lg">
            <Icon icon="logos:whatsapp-icon" width="40" height="40" />
          </a>
          <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${urlOrigin}/vacancy/${currentJobId}`)}`}
            target="_blank" rel="noopener noreferrer"
            className="px-4 py-2 text-white rounded-lg">
            <Icon icon="logos:facebook" width="40" height="40" />
          </a>
          <a href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(`${urlOrigin}/vacancy/${currentJobId}`)}`}
            target="_blank" rel="noopener noreferrer"
            className="px-4 py-2  text-white rounded-lg">
            <Icon icon="skill-icons:linkedin" width="40" height="40" />
          </a>

          <a target="_blank" rel="noopener noreferrer" className="px-4 py-2  text-blue rounded-lg hover:cursor-pointer" title="Copy Text" onClick={() => { navigator.clipboard.writeText(`${urlOrigin}/vacancy/${currentJobId}`) }}>
            <Icon icon="cil:copy" width="40" height="40" />
          </a>
        </div>
      </AdvancedModal>
    </div>
  );
};

export default VacancyInformation;

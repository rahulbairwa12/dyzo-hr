import { React, useState, useEffect, useRef } from "react";
import Button from "@/components/ui/Button";
import { ToastContainer, toast } from "react-toastify";
import useWidth from "@/hooks/useWidth";
import ClientList from "@/components/client/ClientList";
import { fetchAuthGET, fetchGET } from "@/store/api/apiSlice";
import { useSelector } from "react-redux";
import SkeletionTable from "@/components/skeleton/Table";
import AddClientModal from "@/components/client/AddClientModal";
import ShareClientModal from "@/components/client/ShareClientModal";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/Icon";

const ClientManagement = () => {
  const userInfo = useSelector((state) => state.auth.user);
  const { width, breakpoints } = useWidth();
  const [isLoaded, setIsLoaded] = useState(true);
  const [clients, setClients] = useState([]);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showShareClientModal, setShowShareClientModal] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const buttonRef = useRef(null);
  const popupRef = useRef(null);
  const navigate = useNavigate();
  const isMobile = width < breakpoints.md;

  const fetchClient = async () => {
    try {
      const { data } = await fetchGET(`${import.meta.env.VITE_APP_DJANGO}/employee/list/${userInfo.companyId}/`);
      const onlyClient =
        data.filter(emp => emp.isActive && emp.is_client);
      setClients(onlyClient)
    } catch (error) {
      // Handle error if needed
    } finally {
      setIsLoaded(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target) && !buttonRef.current.contains(event.target)) {
        setShowPopup(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    fetchClient();
  }, []);

  useEffect(() => {
    if (!showAddClientModal) {
      setShowPopup(false);
    }
  }, [showAddClientModal]);

  const handleShareClick = () => {
    setShowShareClientModal(true);
  };

  return (
    <div className="w-full overflow-hidden">
      <ToastContainer />
      <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
        <h4 className="font-medium lg:text-2xl text-xl capitalize text-slate-900">
          Clients
        </h4>
        <div className="flex gap-2 md:gap-4 items-center">
          <div className="relative">
            <Button
              ref={buttonRef}
              icon="heroicons-outline:user-plus"
              text={isMobile ? "" : "Add"}
              className={`btn-dark dark:bg-slate-800 h-min text-sm font-normal ${isMobile ? 'p-2' : ''}`}
              iconClass={`${isMobile ? 'text-base' : 'text-lg'}`}
              onClick={() => setShowPopup(!showPopup)}
            />

            {showPopup && (
              <div 
                ref={popupRef} 
                className={`absolute ${isMobile ? 'right-0 w-44' : 'right-0'} top-full mt-2 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg shadow-lg z-50 py-2 px-2 space-y-1.5`}
              >
                <Button
                  className="w-full text-left hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-all py-1.5 text-sm font-normal flex items-center gap-2 px-2"
                  onClick={() => setShowAddClientModal(true)}
                >
                  <Icon icon="heroicons-outline:user-plus" className="text-base" />
                  <span>Add Client</span>
                </Button>
                <Button
                  className="w-full text-left hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-all py-1.5 text-sm font-normal flex items-center gap-2 px-2"
                  onClick={() => navigate("/invite-user")}
                >
                  <Icon icon="fluent-mdl2:chat-invite-friend" className="text-base" />
                  <span>Invite Client</span>
                </Button>
              </div>
            )}
          </div>

          <Button
            icon="solar:share-linear"
            text={isMobile ? "" : "Share"}
            className={`btn-dark dark:bg-slate-800 h-min text-sm font-normal ${isMobile ? 'p-2' : ''}`}
            iconClass={`${isMobile ? 'text-base' : 'text-lg'}`}
            onClick={handleShareClick}
          />
        </div>
      </div>

      {isLoaded ? (
        <SkeletionTable count="20" />
      ) : (
        <div className={`${isMobile ? 'overflow-x-auto -mx-4 px-4' : ''}`}>
          {clients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <Icon icon="heroicons-outline:user-group" className="text-4xl text-slate-300" />
              <p className="text-center text-slate-500">No clients found</p>
              <Button
                className="btn-dark dark:bg-slate-800 h-min text-sm"
                icon="heroicons-outline:user-plus"
                text="Add Client"
                onClick={() => setShowAddClientModal(true)}
              />
            </div>
          ) : (
            <ClientList clients={clients} fetchClient={fetchClient} />
          )}
        </div>
      )}

      {showAddClientModal && (
        <AddClientModal
          showAddClientModal={showAddClientModal}
          setShowAddClientModal={setShowAddClientModal}
          fetchClient={fetchClient}
        />
      )}

      {showShareClientModal && (
        <ShareClientModal
          showShareClientModal={showShareClientModal}
          setShowShareClientModal={setShowShareClientModal}
          clients={clients}
        />
      )}
    </div>
  );
};

export default ClientManagement;

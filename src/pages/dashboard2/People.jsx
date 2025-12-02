import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ModernTooltip from '@/components/ui/ModernTooltip';
import { ProfilePicture } from '@/components/ui/profilePicture';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers } from '@/store/usersSlice';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileCardWrapper from '@/components/ui/ProfileCardWrapper';

const PeopleCardSkeleton = () => (
  <div className="flex items-center gap-2 mr-4 animate-pulse">
    <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-slate-700 mb-1"></div>
    <div className="flex flex-col gap-2">
      <div className="h-4 w-24 bg-gray-200 dark:bg-slate-700 rounded"></div>
      <div className="h-3 w-16 bg-gray-200 dark:bg-slate-700 rounded"></div>
    </div>
  </div>
);

const People = () => {
  const dispatch = useDispatch();
  const { users, loading } = useSelector((state) => state.users);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const userInfo = useSelector((state) => state.auth.user);
  const navigate = useNavigate();

  // Permission check
  const canInvite = userInfo?.isAdmin || userInfo?.permissions?.permissions?.InviteEmployee?.Invite;
  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const truncate = (str, n = 14) => str && str.length > n ? str.slice(0, n) + '...' : str;

  // Filter users based on search query
  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-neutral-50 dark:border-slate-700 dark:border p-5 pr-1 min-h-[508px]">
      <div className="flex items-center justify-between mb-4 pr-5">
        <div className="font-semibold xl:text-xl text-lg text-customBlack-50 dark:text-customWhite-50">People</div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search people..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-48 px-3 py-2 text-sm border-2 border-neutral-50 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-customBlack-50 dark:text-customWhite-50 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-electricBlue-50 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ×
            </button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 xl:gap-6 gap-3 overflow-y-auto max-h-[400px] pr-2 bg-white dark:bg-slate-800">
        <Modal
          activeModal={showPermissionModal}
          onClose={() => setShowPermissionModal(false)}
          title="Permission Denied"
          centered
          className='max-w-md w-[250px]'
          icon="fluent-color:warning-20"
        >
          <div className="text-center text-customRed-50 font-semibold text-base mb-2">You do not have permission to invite a user.</div>
          <div className="text-center text-customGray-300  text-xs">Please contact your Team Leader or Admin for access.</div>
          <div className="flex justify-center mt-6">
            <Button text="Close" onClick={() => setShowPermissionModal(false)} className="btn px-6 py-1.5 btn-dark bg-customRed-50 text-white" />
          </div>
        </Modal>
        <div
          className="flex items-center mr-4 gap-2 cursor-pointer"
          onClick={() => {
            if (canInvite) {
              navigate('/invite-user');
            } else {
              setShowPermissionModal(true);
            }
          }}
        >
          <ModernTooltip content={<span className='dark:text-white font-normal'>Invite a user</span>} theme='custom-light' placement="top">
            <div className="w-12 h-12 min-w-[72px] min-h-[72px] xl:min-w-[72px] xl:min-h-[72px] md:min-w-[52px] md:min-h-[52px] border-2 border-dashed border-neutral-300 dark:border-slate-700 rounded-full flex items-center justify-center text-2xl text-neutral-300 dark:text-customGray-150 mb-1">+</div>
          </ModernTooltip>
          <span className="text-neutral-300 dark:text-customGray-150 md:text-base text-sm font-medium">Invite</span>
        </div>
        {loading && users.length === 0 && (
          <>
            {[...Array(7)].map((_, idx) => (
              <PeopleCardSkeleton key={idx} />
            ))}
          </>
        )}
        {filteredUsers && filteredUsers.length > 0 && filteredUsers.map((p, i) => (
          <div key={i} className="flex items-center gap-2 mr-4 cursor-pointer" onClick={() => {
            const slug = p.name ? p.name.trim().toLowerCase().replace(/\s+/g, '-') : '';
            navigate(`/profile/${p._id}?name=${slug}`);
          }}>
              <div className='flex items-center gap-2 mr-4 cursor-pointer'>
              <ProfileCardWrapper userId={p?._id} >
                <div className="w-12 h-12 min-w-[72px] min-h-[72px] xl:min-w-[72px] xl:min-h-[72px] md:min-w-[52px] md:min-h-[52px]  rounded-full bg-gray-100 dark:bg-slate-700 mb-1 flex items-center justify-center overflow-hidden">
                  <ProfilePicture user={p} />
                </div>
              </ProfileCardWrapper>
                <div className="flex flex-col">
                  <div className='flex flex-col'>
                    <span className="xl:text-base md:text-sm text-sm font-semibold text-customBlack-50 dark:text-customWhite-50 whitespace-nowrap cursor-pointer hover:underline">
                      {truncate(
                        p.name
                          ? p.name
                            .split(' ')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' ')
                          : ''
                      )}
                    </span>

                    <span className="md:text-xs text-xs text-customGray-100 dark:text-customGray-150">
                      {truncate(p.designation)}
                    </span>
                  </div>
                </div>
              </div>
            {/* </ModernTooltip> */}
          </div>
        ))}
      </div>
    </div >
  );
};

export default People; 
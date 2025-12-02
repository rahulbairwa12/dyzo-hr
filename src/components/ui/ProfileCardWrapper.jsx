import React, { useRef, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getUserProfilePicture } from '@/components/ui/profilePicture';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';

const ProfileCardWrapper = ({ userId, children,className }) => {
  const navigate = useNavigate();
  const { users } = useSelector((state) => state.users);
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, alignTop: false, alignRight: false });

  const wrapperRef = useRef(null);

  const user = (users || []).find(u => String(u._id) === String(userId));

  const computePosition = () => {
    if (!wrapperRef.current) return;
    const triggerRect = wrapperRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cardW = 320; // min width
    const cardH = 128; // h-32
    const gap = 0;

    const alignTop = triggerRect.bottom + cardH + gap > vh;
    const alignRight = vw - triggerRect.left < cardW + gap;

    const top = alignTop ? Math.max(0, triggerRect.top - cardH - gap) : Math.min(vh - cardH, triggerRect.bottom + gap);
    const left = alignRight ? Math.max(0, triggerRect.right - cardW) : Math.min(vw - cardW, triggerRect.left);

    setCoords({ top, left, alignTop, alignRight });
  };

  useEffect(() => {
    if (!visible) return;
    computePosition();
    const onReposition = () => computePosition();
    window.addEventListener('scroll', onReposition, true);
    window.addEventListener('resize', onReposition);
    return () => {
      window.removeEventListener('scroll', onReposition, true);
      window.removeEventListener('resize', onReposition);
    };
  }, [visible]);

  if (!user) return children;

  const profilePicUrl = user.image?.trim()
    ? user.image
    : getUserProfilePicture(user);

  const card = (
    <div
      className="fixed z-[2147483646] min-w-[320px] h-32 overflow-hidden bg-white dark:bg-slate-800 shadow-2xl border border-neutral-50 dark:border-slate-700 rounded-lg text-xs"
      style={{ top: coords.top, left: coords.left }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <div className="flex items-start">
        <img
          src={profilePicUrl}
          alt={user?.name}
          className="min-w-[96px] w-24 h-32 object-cover object-top"
        />
        <div className="flex flex-col justify-between h-32 w-full">
            <div className="p-2">
                <p className="font-semibold text-sm text-black-500 dark:text-white capitalize">{user?.name}</p>
                <p className="text-xs font-medium text-black-500 dark:text-slate-200">{user?.email}</p>
                {
                    user?.permission &&
                <p className="text-gray-500 dark:text-slate-300 mt-0.5 text-xs">Permission: {user?.permission}</p>
                }
                {
                    user?.designation &&
                <p className="text-gray-500 dark:text-slate-300 text-xs">Role: {user?.designation}</p>
                }
            </div>
            <div className="flex items-center justify-center space-x-2 py-2 bg-electricBlue-100/10">
                <button className="px-2 py-0.5 border border-electricBlue-100 text-electricBlue-100 rounded text-xs font-semibold hover:scale-[1.01]"
                onClick={()=>navigate(`/profile/${userId}`)}
                >
                    View Profile
                </button>
            </div>
        </div>
      </div>
    </div>
  );

  return (
    <div
      ref={wrapperRef}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      className={`relative inline-block ${className}`}
    >
      {children}
      {visible && createPortal(card, document.body)}
    </div>
  );
}

export default ProfileCardWrapper
import React from 'react';
import { components } from 'react-select';
import Button from './Button';
import { useDispatch, useSelector } from 'react-redux';
import { enforceSubscriptionLimit } from '@/store/planSlice';

const CustomMenuList = ({ onButtonClick, buttonText = 'Add New', ...props }) => {
  const userInfo = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  return (
    <div className="relative">
      <components.MenuList {...props} className="max-h-[200px] overflow-y-auto">
        {props.children}
      </components.MenuList>
      { (
        <div className="absolute -bottom-8 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 px-2 shadow-md">
          <Button
            icon='heroicons-outline:plus'
            text={buttonText}
            onClick={() => {
              const allowed = dispatch(enforceSubscriptionLimit());
              if (!allowed) return;
              onButtonClick && onButtonClick();
            }}
            className='bg-[#7A39FF] text-xs font-normal my-1 py-1 px-2 w-full text-white'
          />
        </div>
      )}
    </div>
  );
};

export default CustomMenuList;

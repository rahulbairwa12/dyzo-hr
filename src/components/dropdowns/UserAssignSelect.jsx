import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { Icon } from '@iconify/react';
import { ProfilePicture } from '@/components/ui/profilePicture';

const UserAssignSelect = ({ users, selectedUserId, onChange }) => {
  const [selectedOption, setSelectedOption] = useState(null);
  


  // Format display name
  const getDisplayName = (user) => {
    if (!user) return '';
    
    // If user has a name property, use that
    if (user.name) {
      return user.name;
    }
    
    // If no email, return id or 'Unknown'
    if (!user.email) {
      return user._id ? `User ${user._id}` : 'Unknown User';
    }
    
    // Extract name from email
    const emailName = user.email.split('@')[0];
    const nameParts = emailName.split('.');
    
    if (nameParts.length > 1) {
      // If email is first.last@domain format
      return nameParts.map(part => 
        part.charAt(0).toUpperCase() + part.slice(1)
      ).join(' ');
    }
    
    // Use email name capitalized
    return emailName.charAt(0).toUpperCase() + emailName.slice(1);
  };

  // Format users as options for react-select
  const options = users?.map(user => ({
    value: user._id,
    label: getDisplayName(user),
    email: user.email,
    image: user.image,
    user: user
  })) || [];

  // Set selected user when selectedUserId changes
  useEffect(() => {
    if (users && users.length && selectedUserId) {
      const user = users.find(user => user._id === selectedUserId);
      if (user) {
        setSelectedOption({
          value: user._id,
          label: getDisplayName(user),
          email: user.email,
          image: user.image,
          user
        });
      }
    }
  }, [selectedUserId, users]);

  // Handle selection change
  const handleChange = (option) => {
    setSelectedOption(option);

    
    if (onChange) {
      if (option) {
       
        onChange(option.value);
      } else {
        // Try different empty values to see which one works with your API
        const emptyValue = [];
      
        onChange(emptyValue); // Send empty array when no user is selected
      }
    }
  };

  // Custom option component for the dropdown
  const CustomOption = ({ innerProps, data, isFocused }) => (
    <div 
      {...innerProps}
      className={`flex items-center py-2 px-3 ${isFocused ? 'bg-slate-100 dark:bg-slate-600' : ''}`}
      style={{ cursor: 'default' }}
    >
      <ProfilePicture user={data.user} className="w-6 h-6 rounded-full object-cover mr-2" />
      <div className="flex flex-col">
        <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{data.label}</span>
        {data.email && <span className="text-slate-500 dark:text-slate-400 text-xs">({data.email})</span>}
      </div>
    </div>
  );

  // Custom single value component (selected option display)
  const CustomSingleValue = ({ data }) => (
    <div className="flex items-center ">
      <ProfilePicture user={data.user} className="w-7 mb-[10px] h-7 rounded-full object-cover ml-1 mt-1" />
      <div className="flex justify-between items-center mb-[10px] ml-2">
        <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{data.label}</span>
      </div>
    </div>
  );

  // Custom dropdown indicator with rotation
  const CustomDropdownIndicator = (props) => {
    const { selectProps } = props;
    const { menuIsOpen } = selectProps;
    
    return (
      <div className="px-2 text-slate-400 dark:text-slate-300">
        <Icon 
          icon="heroicons-outline:chevron-down"
          className={`w-4 h-4 transition-transform duration-200 ${menuIsOpen ? 'rotate-180' : ''}`}
        />
      </div>
    );
  };

  // Custom styles
  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      border: '1px solid #E1E1E1',
      borderRadius: '0.5rem',
      minHeight: '29px',
      height: '35px',
      boxShadow: 'none',
      padding: '0px',
      backgroundColor: 'var(--bg-color, white)',
      borderColor: 'var(--border-color, #E1E1E1)',
      '&:hover': {
        border: '1px solid var(--border-hover-color, #ccc)',
      },
      cursor: 'pointer',
      '.dark &, html.dark &': {
        '--bg-color': '#1e293b', // slate-800
        '--border-color': '#475569', // slate-600
        '--border-hover-color': '#64748b', // slate-500
      }
    }),
    menu: (provided) => ({
      ...provided,
      borderRadius: '0.5rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      zIndex: 50,
      overflow: 'hidden',
      marginTop: '4px',
      backgroundColor: 'var(--menu-bg, white)',
      '.dark &, html.dark &': {
        '--menu-bg': '#334155', // slate-700
      }
    }),
    menuList: (provided) => ({
      ...provided,
      padding: '4px',
      maxHeight: '200px',
      backgroundColor: 'var(--menu-bg, white)',
      '&::-webkit-scrollbar': {
        width: '4px',
      },
      '&::-webkit-scrollbar-track': {
        background: 'var(--scroll-track, #f1f1f1)',
      },
      '&::-webkit-scrollbar-thumb': {
        background: 'var(--scroll-thumb, #c1c1c1)',
        borderRadius: '10px',
      },
      '.dark &, html.dark &': {
        '--menu-bg': '#334155', // slate-700
        '--scroll-track': '#475569', // slate-600
        '--scroll-thumb': '#64748b', // slate-500
      }
    }),
    option: (provided) => ({
      ...provided,
      backgroundColor: 'transparent',
      padding: 0,
      margin: '2px 0',
      cursor: 'default'
    }),
    singleValue: (provided) => ({
      ...provided,
      marginLeft: '0',
      color: 'var(--text-color, #0f172a)', // slate-900
      '.dark &, html.dark &': {
        '--text-color': '#e2e8f0', // slate-200
      }
    }),
    valueContainer: (provided) => ({
      ...provided,
      padding: '0 6px',
      height: '42px',
      display: 'flex',
      alignItems: 'center'
    }),
    indicatorsContainer: (provided) => ({
      ...provided,
      height: '35px',
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      padding: '0',
      color: 'var(--indicator-color, #9CA3AF)',
      '@media (prefers-color-scheme: dark)': {
        '--indicator-color': '#94a3b8', // slate-400
      }
    }),
    placeholder: (provided) => ({
      ...provided,
      fontSize: '0.875rem',
      color: 'var(--placeholder-color, #9CA3AF)',
      '@media (prefers-color-scheme: dark)': {
        '--placeholder-color': '#94a3b8', // slate-400
      }
    }),
    input: (provided) => ({
      ...provided,
      margin: '0',
      padding: '0',
      height: '42px',
      color: 'var(--input-color, inherit)',
      '@media (prefers-color-scheme: dark)': {
        '--input-color': '#e2e8f0', // slate-200
      }
    }),
  };

  return (
    <Select
      value={selectedOption}
      onChange={handleChange}
      options={options}
      placeholder="Select user"
      components={{
        Option: CustomOption,
        SingleValue: CustomSingleValue,
        IndicatorSeparator: () => null,
        DropdownIndicator: CustomDropdownIndicator
      }}
      styles={customStyles}
      isSearchable={true}
      className="w-full"
      classNamePrefix="user-select"
      isClearable={true}
    />
  );
};

export default UserAssignSelect; 
import React from 'react'
import { Icon } from '@iconify/react';

const AddTaskIcon = ({ handleClick }) => {
    return (
        <span onClick={handleClick}>
            <div
                className="lg:h-[32px] lg:w-[32px] lg:bg-slate-100 lg:dark:bg-slate-900 dark:text-white text-slate-900 cursor-pointer rounded-full text-[20px] flex flex-col items-center justify-center"
            >
                <Icon icon="icons8:plus" />
            </div>
        </span>


    )
}

export default AddTaskIcon
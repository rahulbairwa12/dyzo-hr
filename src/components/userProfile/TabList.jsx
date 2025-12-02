import React from 'react'
import Card from '../ui/Card';
import { Tab } from "@headlessui/react";
import Icon from '../ui/Icon';
import { Fragment } from 'react';


const TabList = ({ buttons, activeTab, setActiveTab}) => {

    return (
        <div>

            <Card>
                <Tab.Group>
                    <Tab.List className="lg:space-x-8 md:space-x-4 space-x-0 rtl:space-x-reverse z-40 mt-5">
                        {buttons.map((item, i) => (
                            <Tab as={Fragment} key={i}>
                                {({ activeTab }) => (
                                    <button  onClick={() => setActiveTab(item.title)}
                                        className={` inline-flex items-start text-sm font-medium mb-7 capitalize bg-white dark:bg-slate-800 ring-0 foucs:ring-0 focus:outline-none px-2 transition duration-150 before:transition-all before:duration-150 relative before:absolute before:left-1/2 before:bottom-[-6px] before:h-[1.5px]before:bg-primary-500 before:-translate-x-1/2
      
                                         ${activeTab ? "text-primary-500 before:w-full" : "text-slate-500 before:w-0 dark:text-slate-300"}`}>
                                        <span className="text-base relative top-[1px] ltr:mr-1 rtl:ml-1">
                                            <Icon icon={item.icon} />
                                        </span>
                                        {item.title}
                                    </button>
                                )}
                            </Tab>
                        ))}
                    </Tab.List>

                </Tab.Group>
            </Card>
        </div>
    )
}

export default TabList


import React from 'react'
import ExpensesTable from './ExpenseTable'
import Button from "@/components/ui/Button";
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
function expense() {
  return (
    <div>
         <div className="mb-4 ltr:text-left rtl:text-left">
         <div className='flex justify-between'>
            <div className="text-black flex rounded-2 items-center gap-2 pb-6 pt-6">
                <Icon icon="heroicons-outline:document-text" className='w-6 h-6' />
                <p className="text-black font-bold text-lg flex items-center">References</p>
            </div>

            <div className="mt-2 mb-4">
            <Button  className="btn btn-dark text-center dark:border-2 dark:border-white">
                    <Link to={"/expense/add"}>
                      Add Expenses
                      </Link>
                    </Button>
            </div>
           
            </div>

                   
                </div>
<ExpensesTable/>
    </div>
  )
}

export default expense

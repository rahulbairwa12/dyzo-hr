import React from 'react'
import VacanciesList from './VacanciesList'
import { Icon } from '@iconify/react'
import { useNavigate } from 'react-router-dom'
function ViewVacancies() {
  const navigate = useNavigate();
  return (
    <div>
       <div className="flex flex-row items-center gap-2 mb-4">
            <Icon icon="gg:arrow-left-o" className='w-8 h-8 cursor-pointer' onClick={() => navigate(-1)}/>
                <p className="text-black font-semibold text-f20">View Vacancies</p>
            </div>
      <VacanciesList/>
    </div>
  )
}

export default ViewVacancies

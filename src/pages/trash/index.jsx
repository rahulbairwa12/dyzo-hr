import React from 'react'
import TrashTable from './TrashTable'
import { ToastContainer } from 'react-toastify'

const Trash = () => {
  return (
    <>
    <ToastContainer/>
      <div className="space-y-5 bg-white p-2 sm:p-4">
        <TrashTable/>
      </div>
    </>
  )
}

export default Trash
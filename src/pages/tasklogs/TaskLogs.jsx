import SkeletionTable from '@/components/skeleton/Table'
import { fetchAuthGET } from '@/store/api/apiSlice'
import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import TaskLogTable from './TaskLogTable'
import { useLocation } from 'react-router-dom'

const TaskLogs = () => {
    const { taskId } = useParams()
    const [taskLogs, setTaskLogs] = useState([])
    const [loading, setLoading] = useState(false)
    const { state } = useLocation()

    useEffect(() => {
        const fetchTaskLogs = async () => {
            try {
                setLoading(true)
                const { data } = await fetchAuthGET(`${import.meta.env.VITE_APP_DJANGO}/taskLogs/task/${taskId}/`)
                if (data) {
                    setTaskLogs(data)
                }
            } catch (error) {
                console.error(error)
            } finally {
                setLoading(false)
            }
        }

        fetchTaskLogs()
    }, [taskId])

    return (
        <>
            {loading && <SkeletionTable count='20' />}
            {!loading &&
                (
                    taskLogs?.length === 0 ?
                        (
                            <div className='text-center'>No Task Logs Found</div>
                        ) : (
                            <div>
                                <TaskLogTable taskLogs={taskLogs} taskName={state?.task?.taskName} />
                            </div>
                        )

                )}
        </>
    )
}

export default TaskLogs
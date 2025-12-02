import { fetchAuthGET } from '@/store/api/apiSlice'
import { React, useState, useEffect } from 'react'
import SkeletionTable from '../skeleton/Table'
import FamilyDetailList from './FamilyDetailList'
import { useParams } from 'react-router-dom'
import Cards from './Cards'
import FamilyDetailModal from './FamilyDetailModal'

export default function FamilyDetail() {
    const { userId } = useParams()
    const [loading, setLoading] = useState(true)
    const [familyInformation, setFamilyInformation] = useState([])
    const [showFamilyDetailModal, setShowFamilyDetailModal] = useState(false)

    const fetchFamilyInfo = async () => {
        try {
            const familyDetail = await fetchAuthGET(`${import.meta.env.VITE_APP_DJANGO}/employee/${userId}/family_details/`)
            setFamilyInformation(familyDetail)

        } catch (error) {
        }
        finally {
            setLoading(false)
        }
    }


    useEffect(() => {
        fetchFamilyInfo()
    }, [userId])


    const onClickEdit = () => {
        setShowFamilyDetailModal(true)
    }



    return (
        <>
            <Cards title="Family Details" onClick={onClickEdit}>
                {
                    loading ? (
                        <div className="text-center"><SkeletionTable count={3} /></div>
                    ) : (
                        familyInformation?.length > 0 ? (
                            <div className="">
                                {
                                    <FamilyDetailList familyInformation={familyInformation} fetchFamilyInfo={fetchFamilyInfo} />
                                }
                            </div>
                        ) : (
                            <div className="text-center">No Details Found</div>
                        )
                    )
                }
            </Cards>

            <FamilyDetailModal showFamilyDetailModal={showFamilyDetailModal} setShowFamilyDetailModal={setShowFamilyDetailModal} fetchFamilyInfo={fetchFamilyInfo} />

        </>
    )
}

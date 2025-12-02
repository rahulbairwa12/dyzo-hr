import { React, useState, useEffect } from 'react'
import Icon from '../ui/Icon'
import { fetchAuthGET } from '@/store/api/apiSlice'
import { toast } from 'react-toastify'
import Loading from '../Loading'
import Cards from './Cards'
import BankInfoModal from './BankInfoModal'
import { useParams } from 'react-router-dom'

export const BankInfoCard = () => {
    const {userId} = useParams()
    const [loading, setLoading] = useState(false);
    const [bankInfo, setBankInfo] = useState({});
    const [showBankInfoModal, setShowBankInfoModal] = useState(false);

    const onClickEdit = () => setShowBankInfoModal(true);

    const fetchBankInfo = async () => {
        try {
            setLoading(true);
            const { data } = await fetchAuthGET(`${import.meta.env.VITE_APP_DJANGO}/employee/${userId}/bank_details/`);
            if (data) {
                setBankInfo(data);
            }
        } catch (error) {
            toast.error('Failed to fetch personal information');
            setBankInfo({})
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        
        fetchBankInfo();
    }, [userId])

    return (
        <div>
            {
                loading ? (<div className="text-center"><Loading /></div>) : (

                    <Cards title="Bank Information"  onClick={onClickEdit}>

                        <ul className="list space-y-8">
                            <li className="flex space-x-3 rtl:space-x-reverse">
                                <div className="flex-none text-2xl text-slate-600 dark:text-slate-300">
                                    <Icon icon="hugeicons:bank" />
                                </div>
                                <div className="flex-1">
                                    <div className="uppercase text-xs text-slate-500 dark:text-slate-300 mb-1 leading-[12px]">
                                        Bank
                                    </div>
                                    <p className="text-base text-slate-600 dark:text-slate-50 capitalize">
                                        {bankInfo?.bank_name}
                                    </p>
                                </div>
                            </li>

                            <li className="flex space-x-3 rtl:space-x-reverse">
                                <div className="flex-none text-2xl text-slate-600 dark:text-slate-300">
                                    <Icon icon="charm:notes" />
                                </div>
                                <div className="flex-1">
                                    <div className="uppercase text-xs text-slate-500 dark:text-slate-300 mb-1 leading-[12px]">
                                        Account Number
                                    </div>
                                    <p className="text-base text-slate-600 dark:text-slate-50">
                                        {bankInfo?.account_number}
                                    </p>
                                </div>
                            </li>

                            <li className="flex space-x-3 rtl:space-x-reverse">
                                <div className="flex-none text-2xl text-slate-600 dark:text-slate-300">
                                    <Icon icon="ic:twotone-code" />
                                </div>
                                <div className="flex-1">
                                    <div className="uppercase text-xs text-slate-500 dark:text-slate-300 mb-1 leading-[12px]">
                                        IFSC Code
                                    </div>
                                    <p className="text-base text-slate-600 dark:text-slate-50 capitalize">
                                        {bankInfo?.ifsc_code}
                                    </p>
                                </div>
                            </li>

                            <li className="flex space-x-3 rtl:space-x-reverse">
                                <div className="flex-none text-2xl text-slate-600 dark:text-slate-300">
                                    <Icon icon="prime:id-card" />
                                </div>
                                <div className="flex-1">
                                    <div className="uppercase text-xs text-slate-500 dark:text-slate-300 mb-1 leading-[12px]">
                                        PAN Number
                                    </div>
                                    <p className="text-base text-slate-600 dark:text-slate-50">
                                        {bankInfo?.pan_number}
                                    </p>
                                </div>
                            </li>


                        </ul>
                    </Cards>

                )
            }
            { <BankInfoModal showBankInfoModal={showBankInfoModal} setShowBankInfoModal={setShowBankInfoModal} bankInfo={bankInfo} fetchBankInfo ={fetchBankInfo} /> }
        </div>
    )
}

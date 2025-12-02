import React, { useState,useEffect  } from 'react'
import SlackLoginScreen from './SlackLoginScreen';
import SlackCompanyAskStep from './SlackCompanyAskStep';
import { useLocation } from 'react-router-dom';

const SlackLoginStep = () => {
    const [step, setStep] = useState(1);
    const [accounts, setAccounts] = useState([]);
    const [loginCredentials, setLoginCredentials] = useState(null);
    const [loginType, setLoginType] = useState(null);
    const [slackCode, setSlackCode] = useState(null);
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const codeParam = params.get("code");
        if (codeParam) {
            
          setSlackCode(codeParam);
        }
      }, [location.search]);

  return (
    <>
      {step === 1 && (
          <SlackLoginScreen handleUpdateStepCount={(count) => setStep(count)} setAccounts={setAccounts} setLoginCredentials={setLoginCredentials} setLoginType={setLoginType} slackCode={slackCode} />
      )}

      {step === 2 && (
          <SlackCompanyAskStep accounts={accounts} loginCredentials={loginCredentials} loginType={loginType} slackCode={slackCode} />
      )}

    </>
  )
}

export default SlackLoginStep;
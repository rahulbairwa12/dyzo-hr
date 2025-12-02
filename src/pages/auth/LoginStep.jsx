import React, { useState } from 'react'
import LoginScreen from './loginScreen';
import CompanyAskStep from './CompanyAskStep';
import { Helmet } from "react-helmet-async";

const LoginStep = () => {
    const [step, setStep] = useState(1);
    const [accounts, setAccounts] = useState([]);
    const [loginCredentials, setLoginCredentials] = useState(null);
    const [loginType, setLoginType] = useState(null);

  return (
    <>
      <Helmet>
        <title>Login | Dyzo</title>
        <meta
          name="description"
          content="Login to your Dyzo account to manage tasks, track time, and access intelligent automation tools that boost your team’s productivity."
        />
        <meta property="og:title" content="Login | Dyzo" />
        <meta property="og:url" content="https://dyzo.ai/login" />
        <link rel="canonical" href="https://dyzo.ai/login" />
      </Helmet>
      {step === 1 && (
          <LoginScreen handleUpdateStepCount={(count) => setStep(count)} setAccounts={setAccounts} setLoginCredentials={setLoginCredentials} setLoginType={setLoginType} />
      )}

      {step === 2 && (
          <CompanyAskStep accounts={accounts} loginCredentials={loginCredentials} loginType={loginType} />
      )}

    </>
  )
}

export default LoginStep;
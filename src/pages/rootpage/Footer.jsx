import React from 'react'
import dyzoLogo from './images/dyzoLogo.svg'
import { Icon } from '@iconify/react'
import { useNavigate } from 'react-router-dom'


const Footer = () => {
    const navigate = useNavigate();
    return (

        <footer className='dark:bg-white'>
            {/* <div className="container">
                <div className="footerLogoBox">
                    <img src={dyzoLogo} width="96px" height="auto" alt="DYZO" />
                </div>
            </div> */}
            <hr className="footerFull-line" />

            <div className="container">
                <div className="footerLinksBox">
                    <div className="footerCopyrightBox">
                        <p>© 2025 Dyzo, All rights reserved. </p>
                    </div>
                    <hr />
                    <div className="footerLinks">
                        <a href="/privacy-policy">Privacy Policy</a>
                        <a href="/terms-and-conditions">Terms of Service</a>
                        <a href="/refund-policy">Refund Policy</a>
                        <a href="/contactus">Contact Us</a>
                    </div>
                    <hr />
                    <div className="footerSocialLinks">
                        <a href="tel:+91-9214930277" aria-label="Call us at +91-9214930277" title="Call us at +91-9214930277"><Icon icon="ion:call-outline" className='w-6 h-6 cursor-pointer' /></a>
                        <a href="mailto:support@dyzo.ai" aria-label="Email us at support@dyzo.ai" title="Email us at support@dyzo.ai"><Icon icon="mdi:email-outline" className='w-6 h-6 cursor-pointer' /></a>
                    </div>

                </div>
            </div>
        </footer>

    )
}

export default Footer
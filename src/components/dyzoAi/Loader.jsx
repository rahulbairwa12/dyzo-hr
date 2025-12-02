import React from 'react'
import { motion } from 'framer-motion'
import dyzoAiLogo from '../../assets/images/logo/dyzo-ai-logo.png'
const Loader = () => {
    return (
        <div className="relative flexitems-center w-full max-w-sm p-3 bg-white rounded-xl border border-neutral-50">

            {/* Loader Content */}

            {/* Loader Text */}
            <div className="flex items-center space-x-3 justify-between">
                {/* AI Icon */}
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 flex items-center justify-center ">
                        <img src={dyzoAiLogo} alt="AI Icon" className="w-full h-full" />
                    </div>
                    <p className="text-sm font-medium">
                        Analyzing your request...
                    </p>
                </div>
                <div className="flex space-x-1">
                    <motion.span
                        className="w-2 h-2 bg-electricBlue-50 rounded-full"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                    />
                    <motion.span
                        className="w-2 h-2 bg-electricBlue-50 rounded-full"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                    />
                    <motion.span
                        className="w-2 h-2 bg-electricBlue-50 rounded-full"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                    />
                </div>
            </div>

        </div>
    )
}

export default Loader
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getUserVersionHistory, updateUserVersion, isVersionNewer, getCurrentAppVersion } from '../services/versionService';

export const useVersionCheck = () => {
    const [shouldShowWhatsNew, setShouldShowWhatsNew] = useState(false);
    const [isCheckingVersion, setIsCheckingVersion] = useState(true);
    const [versionData, setVersionData] = useState(null);

    const userInfo = useSelector((state) => state.auth.user);
    const currentVersion = getCurrentAppVersion();
 

    useEffect(() => {
        const checkVersion = async () => {
            if (!userInfo?._id) {
                setIsCheckingVersion(false);
                return;
            }

            try {
                setIsCheckingVersion(true);
                const versionHistory = await getUserVersionHistory(userInfo._id);

                if (versionHistory) {
                    setVersionData(versionHistory);
                    const lastSeenVersion = versionHistory.last_seen_version?.['web-task-app'] || '0.0.0';
                    const isNewer = isVersionNewer(currentVersion, lastSeenVersion);

                    setShouldShowWhatsNew(isNewer);
                }
            } catch (error) {
                console.error('Error checking version:', error);
                setShouldShowWhatsNew(false);
            } finally {
                setIsCheckingVersion(false);
            }
        };

        checkVersion();
    }, [userInfo?._id, currentVersion]);

    const markVersionAsSeen = async () => {
        if (!userInfo?._id) return;

        try {
            await updateUserVersion(userInfo._id, 'web-task-app', currentVersion);
            setShouldShowWhatsNew(false);
        } catch (error) {
            console.error('Error marking version as seen:', error);
        }
    };

    return {
        shouldShowWhatsNew,
        setShouldShowWhatsNew,
        isCheckingVersion,
        versionData,
        currentVersion,
        markVersionAsSeen
    };
};

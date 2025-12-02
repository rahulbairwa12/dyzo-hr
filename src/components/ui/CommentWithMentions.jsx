import React from 'react';
import DOMPurify from 'dompurify';
import { useSelector } from 'react-redux';
import UserMention from './UserMention';

const CommentWithMentions = ({ rawHtml, className = "" }) => {
    const { deletedUserIds } = useSelector((state) => state.users);
    
    if (!rawHtml) return null;

    // Normalize a few malformed cases where ">" is missing before the name
    let html = String(rawHtml).replace(/(data-user-id=['"][0-9]+['"])(\s*)([A-Za-z])/g, "$1>$3");

    // Add (deleted) to user names in HTML if they are in deletedUserIds
    const mentionRegex = /<span[^>]*class=['"]user-id['"][^>]*data-user-id=['"](\d+)['"][^>]*>(.*?)<\/span>/gi;
    html = html.replace(mentionRegex, (match, userId, userName) => {
        const isDeleted = deletedUserIds?.includes(Number(userId));
        if (isDeleted && userName && !userName.includes('(deleted)')) {
            return match.replace(userName, `${userName} (deleted)`);
        }
        return match;
    });

    // Create new regex for parsing (after replace)
    const parseRegex = /<span[^>]*class=['"]user-id['"][^>]*data-user-id=['"](\d+)['"][^>]*>(.*?)<\/span>/gi;
    const nodes = [];
    let lastIndex = 0;
    let match;

    while ((match = parseRegex.exec(html)) !== null) {
        const [full, id, name] = match;
        const before = html.slice(lastIndex, match.index);
        if (before) {
            nodes.push(
                <span
                    key={`text-${lastIndex}`}
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(before) }}
                />
            );
        }
        nodes.push(
            <UserMention key={`u-${id}-${match.index}`} userId={id} displayName={(name || "").trim()} />
        );
        lastIndex = match.index + full.length;
    }

    const rest = html.slice(lastIndex);
    if (rest) {
        nodes.push(
            <span
                key={`text-rest-${lastIndex}`}
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(rest) }}
            />
        );
    }

    return (
        <div className={className}>
            {nodes}
        </div>
    );
};

export default CommentWithMentions;

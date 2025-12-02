import React, { useState, useEffect, useRef, forwardRef } from 'react';
import { Icon } from "@iconify/react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import ProfileCardWrapper from "../ui/ProfileCardWrapper";
import { ProfilePicture } from "../ui/profilePicture";
import DOMPurify from 'dompurify';
import ModernTooltip from "../ui/ModernTooltip";

const FormattedInputBox = forwardRef(({
  value,
  onChange,
  onKeyDown,
  placeholder = "Ask anything use @ to mention projects, tasks, or users",
  onSend,
  disabled = false,
  className = "",
  isLoading,
  showSearchDropdown = false,
  setInput,
  setInputError // <-- new prop
}, ref) => {
  const navigate = useNavigate();
  const { users } = useSelector((state) => state.users);
  const lastCursorPosition = useRef(0);
  const isUpdatingFromState = useRef(false);
  const isTyping = useRef(false);
  const isUpdatingInnerHTML = useRef(false);
  const MAX_ROWS = 7;
  // Remove local error state
  // const [showImageError, setShowImageError] = useState(false);
  // const [showCharLimitError, setShowCharLimitError] = useState(false);
  const CHAR_LIMIT = 3500;

  // Helper function to get profile picture URL for a user
  const getProfilePictureUrl = (userId, userName) => {
    const user = users.find(u => String(u._id) === String(userId) || String(u.value) === String(userId));

    if (user?.profile_picture && user.profile_picture.trim() !== '' && user.profile_picture !== 'null') {
      return user.profile_picture.startsWith('http')
        ? user.profile_picture
        : `${import.meta.env.VITE_APP_DJANGO}${user.profile_picture}`;
    }

    if (user?.image && user.image.trim() !== '' && user.image !== 'null') {
      return user.image.startsWith('http')
        ? user.image
        : `${import.meta.env.VITE_APP_DJANGO}${user.image}`;
    }

    return `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random&size=64`;
  };

  // Helper function to get caret position in contentEditable
  const getCaretPosition = (element, range) => {
    let position = 0;
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    let node;
    while (node = walker.nextNode()) {
      if (node === range.startContainer) {
        position += range.startOffset;
        break;
      }
      position += node.textContent.length;
    }
    return position;
  };

  // Helper function to get text before cursor in contentEditable
  const getTextBeforeCursor = (element, position) => {
    let text = "";
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    let node;
    let currentPos = 0;
    while (node = walker.nextNode()) {
      const nodeLength = node.textContent.length;
      if (currentPos + nodeLength >= position) {
        text += node.textContent.substring(0, position - currentPos);
        break;
      }
      text += node.textContent;
      currentPos += nodeLength;
    }
    return text;
  };

  // Helper function to get text after cursor in contentEditable
  const getTextAfterCursor = (element, position) => {
    let text = "";
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    let node;
    let currentPos = 0;
    while (node = walker.nextNode()) {
      const nodeLength = node.textContent.length;
      if (currentPos + nodeLength > position) {
        text += node.textContent.substring(position - currentPos);
        break;
      }
      currentPos += nodeLength;
    }
    return text;
  };

  // Helper function to set caret position in contentEditable
  const setCaretPosition = (element, position) => {
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    let node;
    let currentPos = 0;
    while (node = walker.nextNode()) {
      const nodeLength = node.textContent.length;
      if (currentPos + nodeLength >= position) {
        const range = document.createRange();
        range.setStart(node, position - currentPos);
        range.collapse(true);

        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        break;
      }
      currentPos += nodeLength;
    }
  };

  // Format input HTML to render mentions with styled spans
  const formatInputHtml = (rawHtml) => {
    if (!rawHtml) return rawHtml;

    // Sanitize first (avoid malformed attributes turning into text)
    let html = String(rawHtml);

    // Replace project-id spans with styled versions
    html = html.replace(
      /<span[^>]*class=['"]project-id['"][^>]*data-project-id=['"](\d+)['"][^>]*>(.*?)<\/span>/gi,
      (match, projectId, content) => {
        // Extract additional attributes
        const statusMatch = match.match(/data-status=['"](\w+)['"]/i);
        const colorMatch = match.match(/data-project-color=['"](#[a-fA-F0-9]{6})['"]/i);
        const teamCountMatch = match.match(/data-team-count=['"](\d+)['"]/i);

        const status = statusMatch ? statusMatch[1] : null;
        const color = colorMatch ? colorMatch[1] : "#3b82f6";
        const teamCount = teamCountMatch ? parseInt(teamCountMatch[1]) : null;

        // Create a lighter version of the color for background
        const lighterColor = color ? `${color}20` : "#eff6ff"; // Add 20% opacity for lighter background

        return `<span class="mention-item project-mention" data-project-id="${projectId}" contenteditable="false" spellcheck="false" style="display:inline-flex; align-items:center; gap:4px; padding:2px 8px; margin:0 2px; background-color:#f3f4f6; border:1px solid #d1d5db; border-radius:4px;  border-radius:6px; cursor:pointer; transition:all 0.2s; user-select:none; -webkit-user-select:none; -moz-user-select:none; -ms-user-select:none;">
                   <div style="width:12px; height:12px; border-radius:4px; border:1px solid ${color}; background-color:${color};"></div>
                   <span style="font-weight:500; font-size:14px;">${content}</span>
        </span>`;
      }
    );

    // Replace user-id spans with styled versions
    html = html.replace(
      /<span[^>]*class=['"]user-id['"][^>]*data-user-id=['"](\d+)['"][^>]*>(.*?)<\/span>/gi,
      (match, userId, content) => {
        const cleanContent = content.replace(/<[^>]*>/g, '').trim();
        const profilePicUrl = getProfilePictureUrl(userId, cleanContent);
        return `<span class="user-id" data-user-id="${userId}" contenteditable="false" spellcheck="false" style="display:inline-flex; align-items:center; gap:4px; padding:1px 4px; margin:1px 2px; background-color:#f3f4f6; border:1px solid #d1d5db; border-radius:4px; cursor:pointer; transition:all 0.2s; user-select:none; -webkit-user-select:none; -moz-user-select:none; -ms-user-select:none;">
                   <div style="width:16px; height:16px; border-radius:50%; overflow:hidden; border:1px solid #bfdbfe; flex-shrink:0; display:flex; align-items:center; justify-content:center;">
                     <img src="${profilePicUrl}" 
                          alt="${cleanContent}" 
                          style="width:16px; height:16px; object-fit:cover; border-radius:50%;"
                          onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(cleanContent)}&background=random&size=64'"
                     />
                   </div>
                   <span style="color:#374151; font-size:14px;">${cleanContent}</span>
                 </span>`;
      }
    );

    // Replace task-id spans with styled versions
    html = html.replace(
      /<span[^>]*class=['"]task-id['"][^>]*data-task-id=['"](\d+)['"][^>]*>(.*?)<\/span>/gi,
      (match, taskId, content) => {
        return `<span class="mention-item task-mention" data-task-id="${taskId}" contenteditable="false" spellcheck="false" style="display:inline-flex; align-items:center; gap:4px; padding:2px 8px; margin:0 2px; background-color:#f3f4f6; border:1px solid #d1d5db; border-radius:4px;  border-radius:6px; cursor:pointer; transition:all 0.2s; user-select:none; -webkit-user-select:none; -moz-user-select:none; -ms-user-select:none;">
                   <span style="height:16px; min-width:16px; min-hight:16px; width:16px; font-size:16px; color:#000000;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="m10.6 13.8l-2.15-2.15q-.275-.275-.7-.275t-.7.275t-.275.7t.275.7L9.9 15.9q.3.3.7.3t.7-.3l5.65-5.65q.275-.275.275-.7t-.275-.7t-.7-.275t-.7.275zM12 22q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22m0-2q3.35 0 5.675-2.325T20 12t-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20m0-8"></path></svg></span>
                   <span style="font-weight:500; font-size:14px;">${content}</span>
        </span>`;
      }
    );
    setInput(html)
    return html;
  };
  // Handle input change
  const handleInputChange = (e) => {
    // Skip if we're updating innerHTML programmatically
    if (isUpdatingInnerHTML.current) return;

    const newValue = e.target.innerHTML || e.target.textContent || "";

    // Mark that user is actively typing
    isTyping.current = true;

    // Store cursor position before updating state
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const cursorPos = getCaretPosition(ref.current, range);
      lastCursorPosition.current = cursorPos;
    }

    // Only update state if the value actually changed
    if (newValue !== value) {
      onChange(newValue);
    }

    // Reset typing flag after a short delay
    setTimeout(() => {
      isTyping.current = false;
    }, 100);
  };

  // Prevent editing of mention items
  const handleKeyDown = (e) => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      let node = range.startContainer;

      // Check if cursor is inside a mention item
      while (node && node.nodeType !== Node.ELEMENT_NODE) {
        node = node.parentNode;
      }

      if (node && (node.classList.contains('mention-item') || node.closest('.mention-item'))) {
        // Prevent ALL editing inside mention items
        e.preventDefault();
        e.stopPropagation();

        // Move cursor outside the mention immediately
        const mentionItem = node.classList.contains('mention-item') ? node : node.closest('.mention-item');
        if (mentionItem) {
          const newRange = document.createRange();
          newRange.setStartAfter(mentionItem);
          newRange.collapse(true);

          selection.removeAllRanges();
          selection.addRange(newRange);
          ref.current.focus();
        }
        return;
      }
    }

    // Handle Enter key for sending
    if (e.key === "Enter" && !e.shiftKey) {
      // If search dropdown is open, let the parent handle it
      if (showSearchDropdown) {
        if (onKeyDown) {
          onKeyDown(e);
        }
      } else {
        e.preventDefault();
        handleSendClick();
      }
    } else if (onKeyDown) {
      onKeyDown(e);
    }
  };

  // Set initial content and format
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Set initial content if empty
    if (!el.innerHTML && value) {
      isUpdatingInnerHTML.current = true;
      const formattedHtml = formatInputHtml(value);
      el.innerHTML = DOMPurify.sanitize(formattedHtml, {
        ALLOWED_TAGS: ['span', 'div', 'br', 'img', 'svg', 'path'],
        ALLOWED_ATTR: ['class', 'style', 'data-user-id', 'data-project-id', 'data-task-id', 'contenteditable', 'spellcheck', 'src', 'alt', 'onerror', 'xmlns', 'width', 'height', 'viewBox', 'fill', 'd']
      });
      setTimeout(() => {
        isUpdatingInnerHTML.current = false;
      }, 0);
    }
  }, []);

  // Clear input when value becomes empty
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // If value is empty but input has content, clear it
    if (!value && el.innerHTML.trim() !== '') {
      isUpdatingInnerHTML.current = true;
      el.innerHTML = '';
      setTimeout(() => {
        isUpdatingInnerHTML.current = false;
      }, 0);
    }
  }, [value]);

  // Auto-resize contentEditable div and format content
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Auto-resize
    el.style.height = "auto";
    const lh = parseFloat(getComputedStyle(el).lineHeight) || 24;
    const maxH = lh * MAX_ROWS;
    const nextH = Math.min(el.scrollHeight, maxH);
    el.style.height = `${nextH}px`;
    el.style.overflowY = el.scrollHeight > maxH ? "auto" : "hidden";

    // Format content only when not typing and value has changed
    if (!isTyping.current && value && el.innerHTML !== value) {
      const formattedHtml = formatInputHtml(value);
      if (formattedHtml !== el.innerHTML) {
        isUpdatingInnerHTML.current = true;
        const selection = window.getSelection();
        const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
        const cursorPos = range ? getCaretPosition(el, range) : 0;

        el.innerHTML = DOMPurify.sanitize(formattedHtml, {
          ALLOWED_TAGS: ['span', 'div', 'br', 'img', 'svg', 'path'],
          ALLOWED_ATTR: ['class', 'style', 'data-user-id', 'data-project-id', 'data-task-id', 'contenteditable', 'spellcheck', 'src', 'alt', 'onerror', 'xmlns', 'width', 'height', 'viewBox', 'fill', 'd']
        });

        // Restore cursor position after formatting
        if (cursorPos > 0) {
          setTimeout(() => {
            setCaretPosition(el, cursorPos);
            isUpdatingInnerHTML.current = false;
          }, 0);
        } else {
          setTimeout(() => {
            isUpdatingInnerHTML.current = false;
          }, 0);
        }
      }
    }
  }, [value]);

  // Restore cursor position after input updates and ensure cursor is outside mentions
  useEffect(() => {
    // Only restore cursor position if user is not actively typing
    if (lastCursorPosition.current > 0 && ref.current && !isUpdatingFromState.current && !isTyping.current) {
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        if (ref.current) {
          // Check if cursor is inside a mention item
          const selection = window.getSelection();
          if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            let node = range.startContainer;

            // Check if cursor is inside a mention item
            while (node && node.nodeType !== Node.ELEMENT_NODE) {
              node = node.parentNode;
            }

            if (node && (node.classList.contains('mention-item') || node.closest('.mention-item'))) {
              // Move cursor outside the mention item
              const mentionItem = node.classList.contains('mention-item') ? node : node.closest('.mention-item');
              if (mentionItem) {
                // Position cursor after the mention item
                const newRange = document.createRange();
                newRange.setStartAfter(mentionItem);
                newRange.collapse(true);

                selection.removeAllRanges();
                selection.addRange(newRange);
                return; // Don't restore original position
              }
            }
          }

          // If not inside mention, restore original position
          setCaretPosition(ref.current, lastCursorPosition.current);
        }
      });
    }
  }, [value]);

  // Force cursor outside mentions on every render (only when not typing)
  useEffect(() => {
    if (ref.current && !isTyping.current) {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        let node = range.startContainer;

        // Check if cursor is inside a mention item
        while (node && node.nodeType !== Node.ELEMENT_NODE) {
          node = node.parentNode;
        }

        if (node && (node.classList.contains('mention-item') || node.closest('.mention-item'))) {
          // Move cursor outside the mention item
          const mentionItem = node.classList.contains('mention-item') ? node : node.closest('.mention-item');
          if (mentionItem) {
            const newRange = document.createRange();
            newRange.setStartAfter(mentionItem);
            newRange.collapse(true);

            selection.removeAllRanges();
            selection.addRange(newRange);
            ref.current.focus();
          }
        }
      }
    }
  });

  // Add mutation observer to prevent editing mentions
  useEffect(() => {
    if (ref.current) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('mention-item')) {
                // Ensure mention items are non-editable
                node.setAttribute('contenteditable', 'false');
                node.setAttribute('spellcheck', 'false');
              }
            });
          }
        });
      });

      observer.observe(ref.current, {
        childList: true,
        subtree: true
      });

      return () => observer.disconnect();
    }
  }, []);

  // Add selection change listener to prevent cursor inside mentions
  useEffect(() => {
    const handleSelectionChange = () => {
      // Only handle selection change if user is not actively typing
      if (isTyping.current) return;

      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        let node = range.startContainer;

        // Check if cursor is inside a mention item
        while (node && node.nodeType !== Node.ELEMENT_NODE) {
          node = node.parentNode;
        }

        if (node && (node.classList.contains('mention-item') || node.closest('.mention-item'))) {
          // Move cursor outside the mention item
          const mentionItem = node.classList.contains('mention-item') ? node : node.closest('.mention-item');
          if (mentionItem) {
            const newRange = document.createRange();
            newRange.setStartAfter(mentionItem);
            newRange.collapse(true);

            selection.removeAllRanges();
            selection.addRange(newRange);
            if (ref.current) {
              ref.current.focus();
            }
          }
        }
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  // Automatically move cursor outside mentions when they are inserted
  useEffect(() => {
    if (ref.current && value && !isTyping.current) {
      // Check if value contains mention HTML (indicating a mention was just added)
      const hasMentions = value.includes('mention-item') || value.includes('data-user-id') || value.includes('data-project-id') || value.includes('data-task-id');

      if (hasMentions) {
        // Force cursor to end of input when mentions are present
        setTimeout(() => {
          if (ref.current) {
            const selection = window.getSelection();
            const range = document.createRange();

            // Find the last text node or element
            const walker = document.createTreeWalker(
              ref.current,
              NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
              null,
              false
            );

            let lastNode = null;
            let node;
            while (node = walker.nextNode()) {
              lastNode = node;
            }

            if (lastNode) {
              if (lastNode.nodeType === Node.TEXT_NODE) {
                range.setStart(lastNode, lastNode.textContent.length);
              } else {
                range.setStartAfter(lastNode);
              }
              range.collapse(true);

              selection.removeAllRanges();
              selection.addRange(range);
              ref.current.focus();
            }
          }
        }, 10); // Small delay to ensure DOM is updated
      }
    }
  }, [value]);

  // Handle send button click
  const handleSendClick = () => {
    if (onSend && value.trim()) {
      onSend();
      setInput('');

      // Clear the contentEditable div
      if (ref.current) {
        isUpdatingInnerHTML.current = true;
        ref.current.innerHTML = '';
        setTimeout(() => {
          isUpdatingInnerHTML.current = false;
        }, 0);
      }
    }
  };

  // Handle @ button click
  const handleAtButtonClick = () => {
    if (!ref.current) return;

    // Focus the input first
    ref.current.focus();

    // Get current selection/cursor position
    const selection = window.getSelection();
    let range;

    if (selection.rangeCount > 0) {
      range = selection.getRangeAt(0);
    } else {
      // If no selection, create one at the end
      range = document.createRange();
      range.selectNodeContents(ref.current);
      range.collapse(false);
    }

    // Create a text node with @ symbol
    const atNode = document.createTextNode('@');

    // Insert the @ symbol at cursor position
    range.insertNode(atNode);

    // Move cursor after the @ symbol
    range.setStartAfter(atNode);
    range.collapse(true);

    // Update selection
    selection.removeAllRanges();
    selection.addRange(range);

    // Update the input value
    const newValue = ref.current.innerHTML;
    onChange(newValue);

    // Trigger the input change to show search dropdown
    const syntheticEvent = {
      target: {
        innerHTML: newValue,
        textContent: newValue
      }
    };
    handleInputChange(syntheticEvent);
  };

  return (
    <>
      {/* Remove error message rendering from here */}
      <div className={`relative w-full cursor-text ${className}`}>
        <div
          ref={ref}
          contentEditable={!disabled}
          onInput={(e) => {
            // Prevent typing over char limit
            let text = e.target.innerText || '';
            // Remove <br> if input is empty
            if (text.trim() === '' && e.target.innerHTML.includes('<br')) {
              e.target.innerHTML = '';
              text = '';
            }
            if (text.length > CHAR_LIMIT) {
              e.target.innerText = text.slice(0, CHAR_LIMIT);
              setInputError && setInputError('Character limit exceeded (3500 characters max).');
              setTimeout(() => setInputError && setInputError(''), 2000);
              // Move cursor to end
              const range = document.createRange();
              const sel = window.getSelection();
              range.selectNodeContents(e.target);
              range.collapse(false);
              sel.removeAllRanges();
              sel.addRange(range);
              return;
            }
            handleInputChange(e);
          }}
          onKeyDown={handleKeyDown}
          onClick={(e) => {
            // Move cursor outside mention items when clicked
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              let node = range.startContainer;

              // Check if click is inside a mention item
              while (node && node.nodeType !== Node.ELEMENT_NODE) {
                node = node.parentNode;
              }

              if (node && (node.classList.contains('mention-item') || node.closest('.mention-item'))) {
                e.preventDefault();
                // Move cursor after the mention item
                const mentionItem = node.classList.contains('mention-item') ? node : node.closest('.mention-item');
                if (mentionItem) {
                  const newRange = document.createRange();
                  newRange.setStartAfter(mentionItem);
                  newRange.collapse(true);

                  selection.removeAllRanges();
                  selection.addRange(newRange);
                  ref.current.focus();
                }
              }
            }
          }}
          onFocus={(e) => {
            // Ensure cursor is not inside mentions when focused
            setTimeout(() => {
              const selection = window.getSelection();
              if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                let node = range.startContainer;

                while (node && node.nodeType !== Node.ELEMENT_NODE) {
                  node = node.parentNode;
                }

                if (node && (node.classList.contains('mention-item') || node.closest('.mention-item'))) {
                  const mentionItem = node.classList.contains('mention-item') ? node : node.closest('.mention-item');
                  if (mentionItem) {
                    const newRange = document.createRange();
                    newRange.setStartAfter(mentionItem);
                    newRange.collapse(true);

                    selection.removeAllRanges();
                    selection.addRange(newRange);
                  }
                }
              }
            }, 0);
          }}
          onPaste={(e) => {
            // Prevent pasting images
            if (e.clipboardData && Array.from(e.clipboardData.items).some(item => item.type.startsWith('image/'))) {
              e.preventDefault();
              setInputError && setInputError('Image insertion is not supported.');
              setTimeout(() => setInputError && setInputError(''), 2000);
              return;
            }
            // Prevent pasting over char limit
            const pasteText = e.clipboardData.getData('text/plain') || '';
            const currentLength = (ref.current?.innerText || '').length;
            if (currentLength + pasteText.length > CHAR_LIMIT) {
              e.preventDefault();
              setInputError && setInputError('Character limit exceeded (3500 characters max).');
              setTimeout(() => setInputError && setInputError(''), 2000);
              return;
            }
            // Prevent pasting into mention items
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              let node = range.startContainer;
              while (node && node.nodeType !== Node.ELEMENT_NODE) {
                node = node.parentNode;
              }
              if (node && (node.classList.contains('mention-item') || node.closest('.mention-item'))) {
                e.preventDefault();
                return;
              }
            }
          }}
          onDrop={(e) => {
            // Prevent dropping images
            if (e.dataTransfer && Array.from(e.dataTransfer.items).some(item => item.type.startsWith('image/'))) {
              e.preventDefault();
              setInputError && setInputError('Image insertion is not supported.');
              setTimeout(() => setInputError && setInputError(''), 2000);
              return;
            }
          }}
          data-placeholder={placeholder}
          className="w-full pr-20 pl-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-electricBlue-100 text-sm resize-none leading-6 min-h-[40px] max-h-[168px] overflow-y-auto empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 empty:before:pointer-events-none border-neutral-50"
          style={{
            scrollbarGutter: "stable",
            spellCheck: "false",
            WebkitSpellCheck: "false"
          }}
          spellCheck="false"
          suppressContentEditableWarning={true}
        />
        {/* @ Button */}
        <ModernTooltip content="click to mention projects, tasks, or users" placement="top">
          <button
            onClick={handleAtButtonClick}
            type="button"
            className="absolute right-12 bottom-0.5 m-1 p-2 rounded-md transition-colors text-gray-500 hover:text-white hover:bg-electricBlue-50 border"
          >
            <Icon icon="mdi:at" className="h-5 w-5" />
          </button>
        </ModernTooltip>
        <button
          onClick={handleSendClick}
          disabled={disabled || !value.trim()}
          className={`absolute right-0.5 bottom-0.5 m-1 p-2 rounded-md transition-colors ${disabled || !value.trim()
            ? "text-gray-400 border border-neutral-50 cursor-not-allowed"
            : "bg-electricBlue-50 text-white hover:bg-electricBlue-100"
            }`}
        >
          {isLoading ? <Icon icon="lsicon:stop-filled" className="h-5 w-5" /> : <Icon icon="gravity-ui:arrow-up" className="h-5 w-5" />}
        </button>
      </div>
    </>
  );
});

export default FormattedInputBox;

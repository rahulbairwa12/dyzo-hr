import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Icon } from "@iconify/react"
import { useSelector } from "react-redux"
import { useLocation } from "react-router-dom"
import AiResponseFormat from "./AiResponseFormat"
import TaskCreationView from "./TaskCreationView"
import TaskUpdateView from "./TaskUpdateView"
import ProjectCreationView from "./ProjectCreationView"
import FormattedInputBox from "./FormattedInputBox"
import MentionList from "./MentionList"
import Loader from "./Loader"
import TaskTimeTable from "../tasks/TaskTimeTable"

export default function DyzoAiModal({ open, onClose }) {
  // Get current location to check if we're on the plans page
  const location = useLocation()
  const isPlansPage = location.pathname === '/plans'

  // Get subscription status from Redux store
  const { subscriptionData } = useSelector((state) => state.plan)
  const isSubscriptionActive = subscriptionData?.subscription_status === "active"

  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [hasInteracted, setHasInteracted] = useState(false)
  const [sessionId, setSessionId] = useState(null) // "" store session id
  const [isLoading, setIsLoading] = useState(false)
  const [inputError, setInputError] = useState("")
  const [isMinimized, setIsMinimized] = useState(false)

  // WebSocket connection state and message queue
  const [wsConnected, setWsConnected] = useState(false)
  const [messageQueue, setMessageQueue] = useState([])
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const maxReconnectAttempts = 20
  const reconnectTimeoutRef = useRef(null)
  const reconnectAttemptsRef = useRef(0) // Use ref to track actual attempts

  // Ref to track the current open state (to access latest value in timeouts)
  const openRef = useRef(open)
  useEffect(() => {
    openRef.current = open
  }, [open])

  // Draggable state
  const [position, setPosition] = useState({ x: 0, y: 0 }) // Default right corner
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isRightCorner, setIsRightCorner] = useState(true) // Track which corner we're in

  // Minimized button position and dragging state
  const [minimizedPosition, setMinimizedPosition] = useState({ x: 0, y: 0 })
  const [isMinimizedDragging, setIsMinimizedDragging] = useState(false)
  const [minimizedDragStart, setMinimizedDragStart] = useState({ x: 0, y: 0 })
  const [hasMinimizedDragged, setHasMinimizedDragged] = useState(false)
  const minimizedButtonRef = useRef(null)

  const userInfo = useSelector((state) => state.auth.user)
  const wsRef = useRef(null)
  const searchWsRef = useRef(null) // "" search websocket
  const inputRef = useRef(null)
  const messagesEndRef = useRef(null) //  auto-scroll anchor
  const modalRef = useRef(null)
  const searchDebounceRef = useRef(null) // Debounce timer for search requests
  const [searchWsConnected, setSearchWsConnected] = useState(false) // Track search WS connection

  // Draggable handlers for full modal
  const handleMouseDown = (e) => {
    // Only allow dragging from header area
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('.search-dropdown')) {
      return
    }

    setIsDragging(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    })
  }

  // Draggable handlers for minimized button
  const handleMinimizedMouseDown = (e) => {
    e.preventDefault()
    e.stopPropagation()

    setHasMinimizedDragged(false)
    setIsMinimizedDragging(true)
    setMinimizedDragStart({
      x: e.clientX - minimizedPosition.x,
      y: e.clientY - minimizedPosition.y
    })
  }

  useEffect(() => {
    const handleResize = () => {
      const windowWidth = window.innerWidth
      const windowHeight = window.innerHeight
      const modalWidth = modalRef.current?.offsetWidth || 400
      const modalHeight = modalRef.current?.offsetHeight || 650

      let newX, newY

      if (isRightCorner) {
        newX = Math.max(16, Math.min(windowWidth - modalWidth - 16, windowWidth - modalWidth - 16))
      } else {
        newX = Math.max(16, Math.min(windowWidth - modalWidth - 16, 16))
      }

      newY = Math.max(16, Math.min(windowHeight - modalHeight - 16, position.y))

      setPosition({ x: newX, y: newY })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isRightCorner, position.y])

  // Initialize position on mount
  useEffect(() => {
    if (open && modalRef.current) {
      const windowWidth = window.innerWidth
      const windowHeight = window.innerHeight
      const modalWidth = modalRef.current.offsetWidth
      const modalHeight = modalRef.current.offsetHeight

      // Ensure modal starts within viewport
      const startX = Math.max(16, Math.min(windowWidth - modalWidth - 16, windowWidth - modalWidth - 16))
      const startY = Math.max(16, Math.min(windowHeight - modalHeight - 16, windowHeight - modalHeight - 16))

      setPosition({ x: startX, y: startY })
    }
  }, [open])

  // Initialize minimized button position
  useEffect(() => {
    if (open && isMinimized) {
      const windowWidth = window.innerWidth
      const windowHeight = window.innerHeight
      const buttonSize = 48 // w-12 h-12

      // Default to bottom-right corner if not yet positioned
      if (minimizedPosition.x === 0 && minimizedPosition.y === 0) {
        setMinimizedPosition({
          x: windowWidth - buttonSize - 24, // 24px from right (6rem)
          y: windowHeight - buttonSize - 24  // 24px from bottom (6rem)
        })
      }
    }
  }, [open, isMinimized, minimizedPosition])

  // Global mouse event listeners for dragging full modal
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e) => {
        const newX = e.clientX - dragStart.x
        const newY = e.clientY - dragStart.y

        // Constrain to viewport boundaries
        const windowWidth = window.innerWidth
        const windowHeight = window.innerHeight
        const modalWidth = modalRef.current?.offsetWidth || 400
        const modalHeight = modalRef.current?.offsetHeight || 650

        const constrainedX = Math.max(0, Math.min(newX, windowWidth - modalWidth))
        const constrainedY = Math.max(0, Math.min(newY, windowHeight - modalHeight))

        setPosition({ x: constrainedX, y: constrainedY })
      }

      const handleGlobalMouseUp = () => {
        setIsDragging(false)

        // Snap to nearest corner
        const windowWidth = window.innerWidth
        const modalWidth = modalRef.current?.offsetWidth || 400

        if (position.x < windowWidth / 2) {
          // Snap to left corner
          setPosition({ x: 16, y: position.y })
          setIsRightCorner(false)
        } else {
          // Snap to right corner
          setPosition({ x: windowWidth - modalWidth - 16, y: position.y })
          setIsRightCorner(true)
        }
      }

      document.addEventListener('mousemove', handleGlobalMouseMove)
      document.addEventListener('mouseup', handleGlobalMouseUp)

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove)
        document.removeEventListener('mouseup', handleGlobalMouseUp)
      }
    }
  }, [isDragging, dragStart, position.x, position.y])

  // Global mouse event listeners for dragging minimized button
  useEffect(() => {
    if (isMinimizedDragging) {
      const handleGlobalMouseMove = (e) => {
        // Mark that user has dragged (moved the mouse)
        setHasMinimizedDragged(true)

        const newX = e.clientX - minimizedDragStart.x
        const newY = e.clientY - minimizedDragStart.y

        // Constrain to viewport boundaries
        const windowWidth = window.innerWidth
        const windowHeight = window.innerHeight
        const buttonSize = 48 // w-12 h-12

        const constrainedX = Math.max(0, Math.min(newX, windowWidth - buttonSize))
        const constrainedY = Math.max(0, Math.min(newY, windowHeight - buttonSize))

        setMinimizedPosition({ x: constrainedX, y: constrainedY })
      }

      const handleGlobalMouseUp = () => {
        setIsMinimizedDragging(false)
      }

      document.addEventListener('mousemove', handleGlobalMouseMove)
      document.addEventListener('mouseup', handleGlobalMouseUp)

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove)
        document.removeEventListener('mouseup', handleGlobalMouseUp)
      }
    }
  }, [isMinimizedDragging, minimizedDragStart])

  // Search state
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [searchPosition, setSearchPosition] = useState({ top: 0, left: 0 })
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(0)
  const [justSelectedItem, setJustSelectedItem] = useState(false)

  // Task creation handlers
  const handleTaskDiscard = () => {

    // Remove the task creation message from messages array
    setMessages(prev => prev.filter(msg => !msg.taskData && !msg.taskUpdateData && !msg.projectData))
  }

  const handleTaskConfirm = (updatedTasks) => {

    // Add logic to confirm the created task with updated data
    // You can send the updated tasks to your API here
  }

  // Task update handlers
  const handleTaskUpdateDiscard = () => {

    // Remove the task update message from messages array
    setMessages(prev => prev.filter(msg => !msg.taskUpdateData))
  }

  const handleTaskUpdateConfirm = (updatedTask) => {

    // Add logic to confirm the updated task
    // The task has already been updated via API call in TaskUpdateView
  }

  // Project creation handlers
  const handleProjectDiscard = () => {

    // Remove the project creation message from messages array
    setMessages(prev => prev.filter(msg => !msg.projectData))
  }

  const handleProjectConfirm = (createdProject) => {

    // Add logic to confirm the created project
    // The project has already been created via API call in ProjectCreationView
  }

  // Search handlers
  const handleSearchSelect = (item) => {
    // Insert the selected item with complete span HTML
    let insertText = ""
    if (item.type === "employee") {
      // Use the complete span HTML from the search result
      insertText = item.name
    } else if (item.type === "task") {
      // Use the complete span HTML from the search result
      insertText = item.name
    } else if (item.type === "project") {
      // Use the complete span HTML from the search result
      insertText = item.name
    }

    // Create the new HTML content by replacing the @search with the selected item
    const lastAtSymbol = input.lastIndexOf("@")
    const textBeforeSearch = input.substring(0, lastAtSymbol)
    const textAfterSearch = input.substring(lastAtSymbol).replace(/@[^@]*$/, '') // Remove the @search part

    const newHTML = `${textBeforeSearch}${insertText} ${textAfterSearch}`

    setInput(newHTML)
    setShowSearchDropdown(false)
    setSearchResults([])
    setSearchTerm("")
    setJustSelectedItem(true) // Mark that we just selected an item

    // Force cursor to end of input after mention is inserted
    setTimeout(() => {
      if (inputRef.current) {
        const selection = window.getSelection();
        const range = document.createRange();

        // Find the last text node or element
        const walker = document.createTreeWalker(
          inputRef.current,
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
          inputRef.current.focus();
        }
      }
    }, 10);
  }

  // Handle input change for search
  const handleInputChange = (newValue) => {
    setInput(newValue)

    // Get plain text from HTML content for search term extraction
    const getPlainText = (html) => {
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = html
      return tempDiv.textContent || tempDiv.innerText || ''
    }

    const plainText = getPlainText(newValue)

    // Get cursor position in plain text
    let cursorPosition = plainText.length // Default to end if we can't determine
    if (inputRef.current) {
      try {
        const selection = window.getSelection()
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0)
          const preCaretRange = range.cloneRange()
          preCaretRange.selectNodeContents(inputRef.current)
          preCaretRange.setEnd(range.endContainer, range.endOffset)
          const textBeforeCursor = preCaretRange.toString()
          cursorPosition = textBeforeCursor.length
        }
      } catch (err) {
        // Fallback: use end of text if cursor position calculation fails
        console.warn("Could not determine cursor position, using end of text:", err)
        cursorPosition = plainText.length
      }
    }

    // Find the @ symbol before cursor position
    const textBeforeCursor = plainText.substring(0, cursorPosition)
    const lastAtSymbol = textBeforeCursor.lastIndexOf("@")

    if (lastAtSymbol !== -1) {
      // Extract search term: text after @ until newline, @ symbol, or end of text
      // Allow spaces and most characters for multi-word searches (e.g., "John Doe")
      const textAfterAt = textBeforeCursor.substring(lastAtSymbol + 1)
      // Extract until we hit a newline, another @, or end of string
      // This allows spaces in search terms like "John Doe" but stops at newlines
      const searchMatch = textAfterAt.match(/^[^\n@]*/)
      const searchText = searchMatch ? searchMatch[0].trim() : ''

      // Only show dropdown if search text is valid (at least 1 char, no newlines, no @ symbols)
      // Trim to remove leading/trailing spaces but allow spaces within the term
      if (searchText.length >= 1 && !searchText.includes('\n') && !searchText.includes('@')) {
        setSearchTerm(searchText)

        // Calculate position for dropdown
        if (inputRef.current) {
          const rect = inputRef.current.getBoundingClientRect()
          setSearchPosition({
            top: rect.top + rect.height + 5,
            left: rect.left + 20,
          })
        }

        setShowSearchDropdown(true)
        setSelectedSearchIndex(0)

        // Debounce search requests to avoid sending too many while typing
        if (searchDebounceRef.current) {
          clearTimeout(searchDebounceRef.current)
        }

        searchDebounceRef.current = setTimeout(() => {
          // Send search request via websocket - check if ready
          if (searchWsRef.current) {
            if (searchWsRef.current.readyState === WebSocket.OPEN) {
              const payload = {
                type: "search",
                search_term: searchText
              }
              searchWsRef.current.send(JSON.stringify(payload))
            } else if (searchWsRef.current.readyState === WebSocket.CONNECTING) {
              // Wait for connection, then send
              const sendWhenReady = () => {
                if (searchWsRef.current && searchWsRef.current.readyState === WebSocket.OPEN) {
                  const payload = {
                    type: "search",
                    search_term: searchText
                  }
                  searchWsRef.current.send(JSON.stringify(payload))
                } else {
                  // Still connecting, wait a bit more
                  setTimeout(sendWhenReady, 100)
                }
              }
              sendWhenReady()
            }
          }
        }, 300) // 300ms debounce
      } else {
        // Search term has space or is empty, hide dropdown
        setShowSearchDropdown(false)
        setSearchResults([])
        setSearchTerm("")
      }
    } else {
      // No @ symbol found
      setShowSearchDropdown(false)
      setSearchResults([])
      setSearchTerm("")
    }
  }

  // Handle keyboard navigation in search dropdown
  const handleKeyDown = (e) => {
    if (showSearchDropdown && searchResults.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedSearchIndex(prev =>
          prev < searchResults.length - 1 ? prev + 1 : 0
        )
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedSearchIndex(prev =>
          prev > 0 ? prev - 1 : searchResults.length - 1
        )
      } else if (e.key === "Enter") {
        e.preventDefault()
        e.stopPropagation()
        if (searchResults[selectedSearchIndex]) {
          handleSearchSelect(searchResults[selectedSearchIndex])
        }
        return
      } else if (e.key === "Escape") {
        e.preventDefault()
        setShowSearchDropdown(false)
        setSearchResults([])
        setSearchTerm("")
      }
    } else {
      // Handle normal Enter key for sending messages
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        // If we just selected an item, send the message
        if (justSelectedItem) {
          setJustSelectedItem(false) // Reset the flag
          sendMessage()
        } else {
          sendMessage()
        }
      }
    }
  }

  //  Auto scroll when messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  // Auto-focus on input when modal opens
  useEffect(() => {
    if (open && inputRef.current) {
      // Increased delay to ensure the modal is fully rendered and animated
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 300);
    }
  }, [open]);

  //  Search WebSocket setup
  useEffect(() => {
    if (!open) {
      // Clean up when modal closes
      if (searchWsRef.current) {
        searchWsRef.current.close()
        searchWsRef.current = null
      }
      setSearchWsConnected(false)
      return
    }

    const searchWs = new WebSocket(`${import.meta.env.VITE_WEBSOCKET_URL}search/${userInfo.companyId}/${userInfo._id}/`)
    searchWsRef.current = searchWs

    searchWs.onopen = () => {
      console.log("✅ Search WebSocket connected")
      setSearchWsConnected(true)
    }

    searchWs.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.type === "search_results") {
          setSearchResults(data.results || [])
        }
      } catch (err) {
        console.error("❌ Search parse error:", err)
      }
    }

    searchWs.onerror = (err) => {
      console.error("⚠️ Search WebSocket error:", err)
      setSearchWsConnected(false)
    }

    searchWs.onclose = () => {
      console.log("🔌 Search WebSocket disconnected")
      setSearchWsConnected(false)
    }

    return () => {
      if (searchWsRef.current) {
        searchWsRef.current.close()
        searchWsRef.current = null
      }
      setSearchWsConnected(false)
      // Clear debounce timer
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current)
        searchDebounceRef.current = null
      }
    }
  }, [open, userInfo.companyId, userInfo._id])
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSearchDropdown && inputRef.current && !inputRef.current.contains(event.target)) {
        // Check if click is outside the search dropdown
        const searchDropdown = event.target.closest('.search-dropdown')
        if (!searchDropdown) {
          setShowSearchDropdown(false)
          setSearchResults([])
          setSearchTerm("")
        }
      }
    }

    if (showSearchDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }

  }, [showSearchDropdown])
  useEffect(() => {
  }, [])
  // WebSocket connection function
  const connectWebSocket = useCallback(() => {
    console.log("🔄 Attempting to connect WebSocket, attempt:", reconnectAttemptsRef.current)


    // Prevent multiple connections
    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) {
      console.log("⚠️ Connection already exists, skipping...")
      return
    }

    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close()
    }

    // Only connect if modal is open
    if (!openRef.current) {
      console.log("⚠️ Modal is closed, skipping connection...")
      return
    }

    const ws = new WebSocket(`${import.meta.env.VITE_WEBSOCKET_URL}ai-assistant/${userInfo._id}/`)
    // const ws = new WebSocket("wss://520fb2ce4d14.ngrok-free.app/ws/ai-assistant/13/")

    wsRef.current = ws
    let buffer = ""

    ws.onopen = () => {


      // Fallback: if we don't receive connection_established within 3 seconds, 
      // assume connection is ready and process queue
      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          setWsConnected(currentConnected => {
            if (!currentConnected) {
              reconnectAttemptsRef.current = 0
              setReconnectAttempts(0)

              // Process queued messages
              setMessageQueue(currentQueue => {
                if (currentQueue.length > 0) {

                  currentQueue.forEach(queuedMessage => {


                    ws.send(JSON.stringify(queuedMessage))
                  })
                  return [] // Clear the queue
                }
                return currentQueue
              })
              return true
            }
            return currentConnected
          })
        }
      }, 3000)
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)


        // Handle connection established message and process queue
        if (data.type === "connection_established") {
          console.log("✅ Connection established confirmed by server")
          setWsConnected(true)
          reconnectAttemptsRef.current = 0
          setReconnectAttempts(0)

          // Process queued messages using current state
          setMessageQueue(currentQueue => {
            if (currentQueue.length > 0) {

              currentQueue.forEach(queuedMessage => {

                ws.send(JSON.stringify(queuedMessage))
              })
              return [] // Clear the queue
            }
            return currentQueue
          })
          return
        }

        if (data.type === "response_chunk") {
          buffer += data.data.chunk || ""

          // Try to extract partial message string from buffer
          let partialMessage = buffer
          let isTaskCreation = false
          let isProjectCreation = false

          try {
            // Check if this might be a task creation response
            if (buffer.includes('"type":"task_created"')) {
              isTaskCreation = true
            }
            // Check if this might be a task update response
            if (buffer.includes('"type":"task_updated"')) {
              isTaskCreation = true // Use same flag for update animations
            }
            // Check if this might be a project creation response
            if (buffer.includes('"type":"project_created"')) {
              isProjectCreation = true
            }

            // Look for `"message":"....` inside the JSON string
            const match = partialMessage.match(/"message"\s*:\s*"([^"]*)/)
            if (match) {
              partialMessage = match[1] // only the message so far
            }
          } catch {
            // fallback, just show raw buffer
          }

          setMessages((prev) => {
            const last = prev[prev.length - 1]
            if (last?.role === "bot" && last?.streaming) {
              return [...prev.slice(0, -1), {
                ...last,
                text: partialMessage,
                streaming: true,
                isTaskCreation,
                isProjectCreation
              }]
            } else {
              setIsLoading(false) //  Stop loading when first chunk arrives
              return [...prev, {
                role: "bot",
                text: partialMessage,
                streaming: true,
                isTaskCreation,
                isProjectCreation
              }]
            }
          })
        }
        if (data.type === "response_complete") {
          let finalText = "(no response)"
          let parsedData = null

          try {
            // ✅ parse once fully complete
            parsedData = JSON.parse(buffer)
            finalText = parsedData.message || buffer
          } catch {
            finalText = buffer
          }

          setMessages((prev) => {
            const last = prev[prev.length - 1]
            if (last?.role === "bot" && last?.streaming) {
              return [...prev.slice(0, -1), {
                role: "bot",
                text: finalText,
                streaming: false,
                taskData: parsedData?.type === "task_created" ? parsedData : null,
                taskUpdateData: parsedData?.type === "task_updated" ? parsedData : null,
                projectData: parsedData?.type === "project_created" ? parsedData : null,
                messageType: parsedData?.type,
                timeSheetList: parsedData?.type === 'time_sheet' ? (parsedData?.time_sheet_list || []) : undefined
              }]
            }
            return [...prev, {
              role: "bot",
              text: finalText,
              streaming: false,
              taskData: parsedData?.type === "task_created" ? parsedData : null,
              taskUpdateData: parsedData?.type === "task_updated" ? parsedData : null,
              projectData: parsedData?.type === "project_created" ? parsedData : null,
              messageType: parsedData?.type,
              timeSheetList: parsedData?.type === 'time_sheet' ? (parsedData?.time_sheet_list || []) : undefined
            }]
          })

          if (data?.data?.session_id) {
            setSessionId(data?.data?.session_id)
          }

          setIsLoading(false) //  Stop loading when response is complete
          buffer = ""
        }
      } catch (err) {
        console.error("❌ Parse error:", err)
      }
    }

    ws.onerror = (err) => {
      console.error("⚠️ WebSocket error:", err)
      setWsConnected(false)
    }

    ws.onclose = () => {

      setWsConnected(false)

      // Clear any existing reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }

      // Attempt to reconnect only if modal is still open and we haven't exceeded max attempts
      if (openRef.current && reconnectAttemptsRef.current < maxReconnectAttempts) {
        // Increment attempt counter BEFORE scheduling reconnect
        reconnectAttemptsRef.current += 1
        setReconnectAttempts(reconnectAttemptsRef.current)

        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current - 1), 10000) // Exponential backoff, max 10s

        reconnectTimeoutRef.current = setTimeout(() => {
          // Only try to reconnect if modal is still open
          if (openRef.current) {
            console.log(`🔄 Executing reconnect attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`)
            connectWebSocket()
          } else {
            console.log("⚠️ Modal closed during reconnect delay, aborting reconnect")
          }
        }, delay)
      } else if (!openRef.current) {
        console.log("⚠️ Modal closed, not reconnecting")
      } else {
        console.log(`❌ Max reconnect attempts (${maxReconnectAttempts}) reached`)
      }
    }
  }, [open, maxReconnectAttempts, userInfo._id])

  //  WebSocket setup
  useEffect(() => {

    if (!open) {

      // Clean up when modal closes
      if (wsRef.current) {

        wsRef.current.close()
        wsRef.current = null
      }
      if (searchWsRef.current) {

        searchWsRef.current.close()
        searchWsRef.current = null
      }
      if (reconnectTimeoutRef.current) {

        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
      // Also update the ref to ensure it's false
      openRef.current = false
      setWsConnected(false)
      setMessageQueue([])
      reconnectAttemptsRef.current = 0
      setReconnectAttempts(0)

      return
    }


    // Only connect if not already connected/connecting
    if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
      connectWebSocket()
    }

    return () => {

      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
      if (searchWsRef.current) {
        searchWsRef.current.close()
        searchWsRef.current = null
      }
      if (reconnectTimeoutRef.current) {

        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
      // Also update the ref to ensure it's false
      openRef.current = false
    }
  }, [open, connectWebSocket])

  //  Send message with queue support
  const sendMessage = useCallback((msg) => {

    const userMessage = msg || input
    if (!userMessage.trim()) return

    // Always add user message to UI immediately
    setMessages((prev) => [...prev, { role: "user", text: userMessage }])
    setInput("")
    setHasInteracted(true)
    setShowSearchDropdown(false)
    setSearchResults([])
    setSearchTerm("")
    setIsLoading(true) //  Start loading

    const payload = {
      type: "query",
      message: userMessage,
      ...(sessionId && { session_id: sessionId }), //  include session if available
      context: { user_id: userInfo._id, company_id: userInfo.companyId, isAdmin: userInfo.isAdmin },
    }

    // Check if WebSocket is connected and ready
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && wsConnected) {

      wsRef.current.send(JSON.stringify(payload))
    } else {
      // Queue the message

      setMessageQueue(prev => [...prev, payload])

      // Try to connect if not connected and modal is open
      if ((!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) && openRef.current) {

        connectWebSocket()
      } else if (!openRef.current) {

      }
    }
  }, [input, sessionId, userInfo._id, userInfo.companyId, userInfo.isAdmin, wsConnected, connectWebSocket])

  const suggestions = [
    { "text": "Find my recently pending tasks", "icon": "mdi:clock-alert" },
    { "text": "Show tasks assigned to me", "icon": "mdi:account-arrow-right" },
    { "text": "Show me my overdue tasks", "icon": "mdi:alert-circle" },
    { "text": "What tasks did I complete this week?", "icon": "mdi:calendar-check" },
    { "text": "List all  active projects with progress", "icon": "mdi:progress-clock" },
    { "text": "Show my work hours for this week", "icon": "mdi:timer" },
    { "text": "Give me a my productivity analysis", "icon": "mdi:chart-bar" }
  ]



  // Render search result item


  // Effect to close the modal when navigating to plans page, but only if subscription is not active
  useEffect(() => {
    // Only close the modal if we're on plans page AND subscription is NOT active
    if (isPlansPage && open && !isSubscriptionActive) {
      onClose();
    }
  }, [isPlansPage, open, onClose, isSubscriptionActive]);

  // Click outside to minimize modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Only minimize if modal is open and not minimized
      if (!open || isMinimized) return;

      // Check if click is outside the modal
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        // Check if click is also outside the minimized button (if it exists)
        if (minimizedButtonRef.current && minimizedButtonRef.current.contains(event.target)) {
          return; // Don't minimize if clicking on minimized button
        }

        // Don't minimize if dragging
        if (isDragging || isMinimizedDragging) return;

        // Don't minimize if clicking on UserMultiSelect dropdown or related elements
        if (
          event.target.closest('.multiuser-select-dropdown') ||
          event.target.closest('.user-multiselect-scroll-area') ||
          event.target.closest('.dropdown-search-area') ||
          event.target.closest('.close-button-multiselect') ||
          event.target.closest('.dropdown-header-multiselect') ||
          event.target.closest('[data-modal]') ||
          event.target.closest('[data-modal-button]')
        ) {
          return; // Don't minimize if clicking on dropdown elements
        }

        // Minimize the modal
        setIsMinimized(true);
      }
    };

    if (open && !isMinimized) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, isMinimized, isDragging, isMinimizedDragging]);

  return (
    <AnimatePresence>
      {open && (!isPlansPage || isSubscriptionActive) && (
        <>
          {/* Minimized State */}
          {isMinimized && (
            <motion.button
              ref={minimizedButtonRef}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => {
                // Only open if user didn't drag
                if (!hasMinimizedDragged) {
                  setIsMinimized(false)
                }
              }}
              onMouseDown={handleMinimizedMouseDown}
              className="fixed z-[9999] w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 flex items-center justify-center group"
              style={{
                left: minimizedPosition.x,
                top: minimizedPosition.y,
                cursor: isMinimizedDragging ? 'grabbing' : 'pointer',
                transform: isMinimizedDragging ? 'none' : undefined,
              }}
              title="Open AI Assistant"
            >
              <Icon icon="mdi:auto-awesome" className="w-8 h-8 text-white" />
              {messageQueue.length > 0 && (
                <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                  {messageQueue.length}
                </span>
              )}
            </motion.button>
          )}

          {/* Full Modal */}
          {!isMinimized && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="w-full max-w-xs sm:max-w-lg bg-white py-3 rounded-2xl pb-0 shadow-[0_0_5px_1px_#9D9D9D] overflow-hidden flex flex-col h-[85vh] max-h-[650px] fixed z-[9999]"
              ref={modalRef}
              style={{
                left: position.x,
                top: position.y,
                cursor: isDragging ? 'grabbing' : 'default',
              }}
            >
              {/* Header */}
              <div className="relative">
                {inputError && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-2 z-50 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-5 py-2 rounded-lg shadow-lg text-sm font-semibold animate-fade-in transition-all duration-300 min-w-[260px] max-w-[90vw]">
                    <Icon icon="mdi:alert-circle-outline" className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <span className="truncate">{inputError}</span>
                  </div>
                )}
                {!hasInteracted ? (
                  <div
                    className="py-9 cursor-grab active:cursor-grabbing"
                    style={{ userSelect: 'none' }}
                    onMouseDown={handleMouseDown}
                  >
                    <h2 className="text-lg font-semibold text-center flex items-center justify-center gap-2">
                      <Icon icon="mdi:stars-outline" className="h-5 w-5 text-electricBlue-100" />
                      Hi <span className="capitalize">{userInfo?.first_name},</span> how can I help you?
                    </h2>
                    <div className="absolute top-3 right-3 flex items-center gap-2">
                      <button
                        className="text-gray-500 hover:text-gray-800 transition-colors"
                        onClick={() => setIsMinimized(true)}
                        title="Minimize"
                      >
                        <Icon icon="ph:minus-bold" className="w-6 h-6" />
                      </button>
                      <button
                        className="text-gray-500 hover:text-gray-800 transition-colors"
                        onClick={() => {

                          onClose()
                        }}
                        title="Close"
                      >
                        <Icon icon="iconamoon:close" className="w-7 h-7" />
                      </button>
                    </div>


                  </div>
                ) : (
                  <div
                    className="flex justify-between items-center border-b border-neutral-100 p-4 pt-1 pb-4 cursor-grab active:cursor-grabbing"
                    style={{ userSelect: 'none' }}
                    onMouseDown={handleMouseDown}
                  >
                    <div className="flex items-center gap-3">
                      <h2 className="font-semibold text-lg">AI Assistant</h2>

                    </div>
                    <div className="absolute top-3 right-3 flex items-center gap-2">
                      <button
                        className="text-gray-500 hover:text-gray-800 transition-colors"
                        onClick={() => setIsMinimized(true)}
                        title="Minimize"
                      >
                        <Icon icon="ph:minus-bold" className="w-6 h-6" />
                      </button>
                      <button
                        className="text-gray-500 hover:text-gray-80 transition-colors"
                        onClick={() => {

                          onClose()
                        }}
                        title="Close"
                      >
                        <Icon icon="iconamoon:close" className="w-7 h-7" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-hidden overflow-y-auto p-3 space-y-3" style={{ userSelect: 'text' }}>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-xl whitespace-pre-line  border border-neutral-100 text-sm ${msg.role === "user"
                      ? " ml-auto w-fit max-w-[80%] text-black-500 bg-customPurple-50"
                      : " text-gray-800 "
                      }`}
                  >
                    {msg.role === "bot" ? (
                      msg.messageType === 'time_sheet' ? (
                        <TaskTimeTable rows={msg.timeSheetList || []} messageText={msg.text} />
                      ) : msg.taskData ? (
                        <TaskCreationView
                          tasks={msg.taskData.tasks}
                          message={msg.taskData.message}
                          onDiscard={handleTaskDiscard}
                          onConfirm={handleTaskConfirm}
                        />
                      ) : msg.taskUpdateData ? (
                        <TaskUpdateView
                          taskData={msg.taskUpdateData.task}
                          message={msg.taskUpdateData.message}
                          changesMade={msg.taskUpdateData.changes_made}
                          onDiscard={handleTaskUpdateDiscard}
                          onConfirm={handleTaskUpdateConfirm}
                        />
                      ) : msg.projectData ? (
                        <ProjectCreationView
                          projectData={msg.projectData.project}
                          message={msg.projectData.message}
                          onDiscard={handleProjectDiscard}
                          onConfirm={handleProjectConfirm}
                        />
                      ) : msg.isTaskCreation && msg.streaming ? (
                        <div className="flex items-center gap-2 text-gray-600">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span>{msg.text.includes('updat') ? 'Updating task...' : 'Creating tasks...'}</span>
                        </div>
                      ) : msg.isProjectCreation && msg.streaming ? (
                        <div className="flex items-center gap-2 text-gray-600">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span>Creating project...</span>
                        </div>
                      ) : (
                        <AiResponseFormat className="contents" message={msg} rawHtml={msg.text} />
                      )
                    ) : (
                      <div dangerouslySetInnerHTML={{ __html: msg.text }}></div>
                    )}
                  </motion.div>
                ))}
                <div ref={messagesEndRef} /> {/*  Auto-scroll anchor */}

                {/* Loading Indicator */}
                {isLoading && (
                  <Loader />
                )}

                {/* Queued Messages Indicator */}
                {!wsConnected && messageQueue.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-xl text-sm text-orange-700"
                  >
                    <Icon icon="mdi:clock-outline" className="w-4 h-4" />
                    <span>
                      {messageQueue.length} message{messageQueue.length > 1 ? 's' : ''} queued.
                      {reconnectAttempts > 0 && ` Reconnecting... (${reconnectAttempts}/${maxReconnectAttempts})`}
                    </span>
                  </motion.div>
                )}

                {!hasInteracted && (
                  <div className="grid gap-2 mt-4">
                    {suggestions.map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(suggestion.text)}
                        className="w-full text-left px-3 py-3 rounded-xl hover:bg-customPurple-50 border border-neutral-100  text-sm"
                      >
                        <div className="flex items-center gap-3">
                          <Icon
                            icon={suggestion.icon}
                            className="w-4 h-4 text-electricBlue-50 flex-shrink-0"
                          />
                          <span className="text-gray-700">{suggestion.text}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="p-3 pt-0  relative">
                <FormattedInputBox
                  ref={inputRef}
                  value={input}
                  setInput={setInput}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onSend={sendMessage}
                  //  placeholder="Ask anything... Use @ to mention"
                  isLoading={isLoading}
                  showSearchDropdown={showSearchDropdown}
                  setInputError={setInputError}
                />

                {/* Search Dropdown */}
                <MentionList
                  searchResults={searchResults}
                  searchTerm={searchTerm}
                  selectedIndex={selectedSearchIndex}
                  onSelect={handleSearchSelect}
                  onMouseEnter={setSelectedSearchIndex}
                  showDropdown={showSearchDropdown}
                  position={searchPosition}
                />
              </div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  )
}

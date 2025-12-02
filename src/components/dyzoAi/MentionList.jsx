import { Icon } from "@iconify/react"
import { useEffect, useRef } from "react"
import ProfileCardWrapper from "../ui/ProfileCardWrapper"
import { ProfilePicture } from "../ui/profilePicture"

export default function MentionList({
    searchResults,
    searchTerm,
    selectedIndex,
    onSelect,
    onMouseEnter,
    showDropdown,
    position
}) {
    const dropdownRef = useRef(null)
    const selectedItemRef = useRef(null)

    // Auto-scroll to keep selected item visible
    useEffect(() => {
        if (selectedItemRef.current && dropdownRef.current) {
            const dropdown = dropdownRef.current
            const selectedItem = selectedItemRef.current
            
            const dropdownRect = dropdown.getBoundingClientRect()
            const itemRect = selectedItem.getBoundingClientRect()
            
            // Check if selected item is outside visible area
            if (itemRect.top < dropdownRect.top) {
                // Item is above visible area, scroll up
                dropdown.scrollTop -= (dropdownRect.top - itemRect.top) + 10
            } else if (itemRect.bottom > dropdownRect.bottom) {
                // Item is below visible area, scroll down
                dropdown.scrollTop += (itemRect.bottom - dropdownRect.bottom) + 10
            }
        }
    }, [selectedIndex])

    // Helper function to clean HTML from names for display
    const cleanName = (htmlString) => {
        return htmlString.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, '')
    }

    // Render search result item
    const renderSearchItem = (item, index) => {
        const isSelected = index === selectedIndex

        if (item.type === "employee") {
            const cleanEmployeeName = cleanName(item.name)
            return (
                <div
                    key={`${item.type}-${item.id}`}
                    ref={isSelected ? selectedItemRef : null}
                    className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${isSelected ? "bg-gray-100 dark:bg-gray-700" : ""
                        }`}
                    onClick={() => onSelect(item)}
                    onMouseEnter={() => onMouseEnter(index)}
                >
                    <ProfileCardWrapper userId={item.user_id}className={"flex gap-1"}>
                        <ProfilePicture
                            userId={item.user_id}
                            className="w-5 h-5 rounded-full border border-blue-200"
                        />
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {cleanEmployeeName}
                            </div>
                        </div>
                    </ProfileCardWrapper>
                </div>
            )
        } else if (item.type === "task") {
            const cleanTaskName = cleanName(item.name)

            return (
                <div
                    key={`${item.type}-${item.id}`}
                    ref={isSelected ? selectedItemRef : null}
                    className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${isSelected ? "bg-gray-100 dark:bg-gray-700" : ""
                        }`}
                    onClick={() => onSelect(item)}
                    onMouseEnter={() => onMouseEnter(index)}
                >
                    <Icon icon="ph:check-circle-light" className="w-5 h-5 text-gray-400" />
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {cleanTaskName}
                        </div>
                    </div>
                </div>
            )
        } else if (item.type === "project") {
            const cleanProjectName = cleanName(item.name)

            // Extract project color from the name HTML
            const colorMatch = item.name.match(/data-project-color=['"](#[a-fA-F0-9]{6})['"]/i)
            const projectColor = colorMatch ? colorMatch[1] : "#3b82f6" // Default blue if no color found

            return (
                <div
                    key={`${item.type}-${item.id}`}
                    ref={isSelected ? selectedItemRef : null}
                    className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${isSelected ? "bg-gray-100 dark:bg-gray-700" : ""
                        }`}
                    onClick={() => onSelect(item)}
                    onMouseEnter={() => onMouseEnter(index)}
                >
                    <div
                        className="w-4 h-4 rounded-[5px] flex items-center justify-center border"
                        style={{
                            borderColor: projectColor,
                            backgroundColor: `${projectColor}40` // 40% opacity for border
                        }}
                    >
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium pl-1 text-gray-900 dark:text-white truncate">
                            {cleanProjectName}
                        </div>
                    </div>
                </div>
            )
        }

        return null
    }

    if (!showDropdown || searchResults.length === 0) {
        return null
    }

    return (
        <div
            ref={dropdownRef}
            className="search-dropdown absolute left-0 right-0 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-64 overflow-y-auto z-50"
            style={{
                bottom: "100%",
                width: "calc(100% - 40px)"
            }}
        >
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                <div className="text-xs font-medium text-gray-600 dark:text-gray-300">
                    Search results for "{searchTerm}"
                </div>
            </div>
            <div className="py-1">
                {searchResults.map((item, index) => renderSearchItem(item, index))}
            </div>
        </div>
    )
}

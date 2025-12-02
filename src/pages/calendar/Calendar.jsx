import React, { useState, useEffect, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin, { Draggable } from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";

import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ExternalDraggingevent from "./dragging-events";
import EventModal from "./EventModal";
import LoaderCircle from "@/components/Loader-circle";
import { fetchAPI, postAPI, deleteAPI, patchAPI, patchUpdateAPI } from "@/store/api/apiSlice";
import { toast } from "react-toastify";
import Cookies from "js-cookie";

const Calendar = () => {
  const calendarComponentRef = useRef(null);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editEvent, setEditEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [getAuthInfo, setAuthInfo] = useState(null);

  const state = new URLSearchParams(window.location.search).get('state');
  const code = new URLSearchParams(window.location.search).get('code');
  const scope = new URLSearchParams(window.location.search).get('scope');

  useEffect(() => {
    const draggableEl = document.getElementById("external-events");

    const initDraggable = () => {
      if (draggableEl) {
        new Draggable(draggableEl, {
          itemSelector: ".fc-event",
          eventData: function (eventEl) {
            let title = eventEl.getAttribute("title");
            let id = eventEl.getAttribute("data");
            return {
              title: title,
              id: id,
              extendedProps: {
                calendar: 'default',
              },
            };
          },
        });
      }
    };

    initDraggable();

    return () => {
      draggableEl?.removeEventListener("mousedown", initDraggable);
    };
  }, []);

  const handleDateClick = (arg) => {
    setEditEvent(null);
    setShowModal(true);
    setSelectedEvent(arg);
  };

  const handleEventClick = (arg) => {
    setShowModal(true);
    setEditEvent(arg);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditEvent(null);
    setSelectedEvent(null);
  };

  const handleAddEvent = async(newEvent) => {
    try {
      const authInfo = JSON.parse(Cookies.get('calendarAuth_credentials'));
      const response = await postAPI(`api/calendar/create_event/`, {
        body: {
          summary: newEvent.title,
          start_dateTime: newEvent.start,
          end_dateTime: newEvent.end,
          credentials: authInfo,
        }
      });

      if (response.status === 1) {
        fetchCurrentCalendarEvents();
        toast.success("Event Added Successfully");
      } else {
        toast.error(response.error);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      const authInfo = JSON.parse(Cookies.get('calendarAuth_credentials'));
      const response = await deleteAPI('api/calendar/delete_event/', {
        event_id: eventId,
        credentials: authInfo,
      });
      if (response.status === 1) {
        setCalendarEvents(calendarEvents.filter(event => event.id !== eventId));
        toast.success("Event Deleted Successfully");
      } else {
        toast.error(response.error);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };    

  const handleEditEvent = async (updatedEvent) => {
    try {
      const authInfo = JSON.parse(Cookies.get('calendarAuth_credentials'));
      const response = await patchUpdateAPI('api/calendar/edit_event/', {
        body: {
          event_id: updatedEvent.event.id,  
          summary: updatedEvent.title,
          start_dateTime: updatedEvent.start,
          end_dateTime: updatedEvent.end, 
          location: updatedEvent.event.location || '',
          description: updatedEvent.event.description || '',
          attendees: updatedEvent.event.attendees || [],
          reminders: updatedEvent.event.reminders || { useDefault: true },
          credentials: authInfo,
        },
      });
  
      if (response.status === 1) {
        fetchCurrentCalendarEvents(); 
        toast.info("Event Edited Successfully");
      } else {
        toast.error(response.error);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };  

  const CalendarAuth = async () => {
    try {
      const calendarAuth = await fetchAPI(`api/calendar/redirect?state=${state}&code=${code}&scope=${scope}`);
      if (calendarAuth.status === 1) {
        Cookies.set('calendarAuth_credentials', JSON.stringify(calendarAuth.credentials));
        setAuthInfo(true);
        setTimeout(() => {
          fetchCurrentCalendarEvents();
        }, 800);
      } else {
        toast.error(calendarAuth.error);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    const calendarAuthInfo = Cookies.get('calendarAuth_credentials');
    if (!calendarAuthInfo && state && code) {
      CalendarAuth();
    }
  }, [state, code]);

  const calendarAuthInfo = Cookies.get('calendarAuth_credentials');

  const transformGoogleEvents = (events) => {
    return events.map(event => ({
      id: event.id,
      title: event.summary,
      start: event.start.dateTime || event.start.date,
      end: event.end.dateTime || event.end.date,
      extendedProps: {
        calendar: 'google',
      }
    }));
  };

  const fetchCurrentCalendarEvents = async () => {
    try {
      const authInfo = JSON.parse(calendarAuthInfo);
      const currentCalendarEvents = await postAPI(`api/calendar/events-by-date-range/`, {
        body: {
          startDate: startDate,
          endDate: endDate,
          credentials: authInfo,
        }
      });
  
      
      if (currentCalendarEvents.status === 1) {
        const transformedEvents = transformGoogleEvents(currentCalendarEvents.events);
        setCalendarEvents(transformedEvents);
      }else {
        await CalendarAuth();
        fetchCurrentCalendarEvents();
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (calendarAuthInfo && startDate && endDate) {
      fetchCurrentCalendarEvents();
    }
  }, [calendarAuthInfo, startDate, endDate]);

  const handleDatesSet = (arg) => {
    const start = new Date(arg.startStr).toISOString().split('T')[0];
    const end = new Date(arg.endStr).toISOString().split('T')[0];
    setStartDate(start);
    setEndDate(end);
  };

  return (
    <div className="dashcode-calender">
      <div className="grid grid-cols-12 gap-4">
        <Card className="lg:col-span-3 col-span-12">
          <Button
            icon="heroicons-outline:plus"
            text=" Add Event"
            className="btn-dark w-full block"
            onClick={() => {
              setShowModal(!showModal);
            }}
          />

          <div id="external-events" className="space-y-1.5 mt-6">
            {/* Add your draggable events here */}
          </div>

        </Card>
        <Card className="lg:col-span-9 col-span-12">
          <FullCalendar
            plugins={[
              dayGridPlugin,
              timeGridPlugin,
              interactionPlugin,
              listPlugin,
            ]}
            ref={calendarComponentRef}
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
            }}
            events={calendarEvents}
            editable={true}
            rerenderDelay={10}
            eventDurationEditable={false}
            selectable={true}
            selectMirror={true}
            droppable={true}
            dayMaxEvents={2}
            weekends={true}
            eventClassNames={() => "google-event"}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            initialView="dayGridMonth"
            datesSet={handleDatesSet}
            eventContent={renderEventContent}
          />
        </Card>
      </div>
      <EventModal
        showModal={showModal}
        onClose={handleCloseModal}
        onAdd={handleAddEvent}
        selectedEvent={selectedEvent}
        event={editEvent}
        onEdit={handleEditEvent}
        // onDelete={(eventId) => setCalendarEvents(calendarEvents.filter(event => event.id !== eventId))}
        onDelete={handleDeleteEvent}
      />
    </div>
  );
};

const renderEventContent = (eventInfo) => {
  return (
    <div className="event-content" style={{ backgroundColor: '#007bff', color: 'white', padding: '2px 4px', borderRadius: '3px' }}>
      <span>{eventInfo.event.title}</span>
    </div>
  );
};

export default Calendar;

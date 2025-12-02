import { djangoBaseURL } from "@/helper";
import { fetchGET, fetchPOST, fetchAuthPut, fetchDelete } from "@/store/api/apiSlice";
import { Icon } from "@iconify/react";
import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

const AddressSetting = () => {
  const apiKey = "AIzaSyCNrXocuQ0PIhsOZ0bD3P2FLJilw4jnuYw";
  const userInfo = useSelector((state) => state.auth.user);
  const companyId = userInfo?.companyId;

  // State for fetching and listing locations
  const [addresses, setAddresses] = useState([]);
  const [dataFetchLoading, setDataFetchLoading] = useState(true);

  // State for Google Maps API loading
  const [isApiLoaded, setIsApiLoaded] = useState(false);
  const autocompleteRef = useRef(null);

  // States for the add/edit form modal
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState("add"); // "add" or "edit"
  const [selectedLocationId, setSelectedLocationId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_address: "",
    latitude: "",
    longitude: "",
    website: "",
    is_default_location: false,
    start_time: "09:00:00",
    end_time: "17:00:00",
  });

  // States for the custom delete confirmation modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteLocationId, setDeleteLocationId] = useState(null);

  // Function to load the Google Maps API
  const loadGoogleMapsAPI = (key) => {
    return new Promise((resolve, reject) => {
      if (window.google && window.google.maps) {
        resolve();
      } else {
        if (!key) {
          reject(new Error("Google Maps API key is missing."));
          return;
        }
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
        script.async = true;
        script.defer = true;

        script.onload = () => {
          if (window.google && window.google.maps) {
            resolve();
          } else {
            reject(new Error("Failed to initialize Google Maps."));
          }
        };

        script.onerror = (event) => {
          reject(new Error("Failed to load Google Maps API. " + event.message));
        };

        document.head.appendChild(script);
      }
    });
  };

  // Load Google Maps API on mount
  useEffect(() => {
    loadGoogleMapsAPI(apiKey)
      .then(() => setIsApiLoaded(true))
      .catch((error) => console.error("Error loading Google Maps API:", error));
  }, [apiKey]);

  // Attach autocomplete to the address input when the form modal is shown
  useEffect(() => {
    if (isApiLoaded && showForm && autocompleteRef.current) {
      const autocomplete = new window.google.maps.places.Autocomplete(autocompleteRef.current, {
        types: [],
      });
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        setFormData((prev) => ({
          ...prev,
          full_address: place.formatted_address || "",
          latitude: place.geometry?.location?.lat() || "",
          longitude: place.geometry?.location?.lng() || "",
          website: place.website || "",
        }));
      });
    }
  }, [isApiLoaded, showForm]);

  // Fetch all locations for the company
  const fetchAddresses = async () => {
    try {
      const response = await fetchGET(`${djangoBaseURL}/companies/${companyId}/multiple/locations/`);
      if (response.status) {
        // Assuming response.data is an array of locations
        setAddresses(response.data);
      } else {
        toast.error("Failed to fetch addresses");
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
      toast.error("Error fetching addresses");
    } finally {
      setDataFetchLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) {
      fetchAddresses();
    }
  }, [companyId]);

  // Handler for input changes in the form
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Submit handler for the add/edit form
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (formMode === "add") {
        // Create a new location
        const response = await fetchPOST(`${djangoBaseURL}/companies/${companyId}/multiple/locations/`, {
          body: formData,
        });
        if (response.status) {
          toast.success("Address added successfully");
          setShowForm(false);
          setFormData({
            full_address: "",
            latitude: "",
            longitude: "",
            website: "",
            is_default_location: false,
            start_time: "09:00:00",
            end_time: "17:00:00",
          });
          fetchAddresses();
        } else {
          toast.error("Failed to add address");
        }
      } else if (formMode === "edit" && selectedLocationId) {
        // Update an existing location using PATCH/PUT
        const response = await fetchAuthPut(
          `${djangoBaseURL}/companies/${companyId}/multiple/locations/${selectedLocationId}/`,
          { body: formData }
        );
        if (response.status) {
          toast.success("Address updated successfully");
          setShowForm(false);
          setFormData({
            full_address: "",
            latitude: "",
            longitude: "",
            website: "",
            is_default_location: false,
            start_time: "09:00:00",
            end_time: "17:00:00",
          });
          setSelectedLocationId(null);
          fetchAddresses();
        } else {
          toast.error("Failed to update address");
        }
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Error submitting form");
    } finally {
      setFormLoading(false);
    }
  };

  // Open form in edit mode when a location is clicked
  const handleEditLocation = (location) => {
    setFormMode("edit");
    setSelectedLocationId(location.id);
    setFormData({
      full_address: location.full_address || "",
      latitude: location.latitude || "",
      longitude: location.longitude || "",
      website: location.website || "",
      is_default_location: location.is_default_location || false,
      start_time: location.start_time || "09:00:00",
      end_time: location.end_time || "17:00:00",
    });
    setShowForm(true);
  };

  // Open form in add mode when "Add Location" is clicked
  const handleAddLocation = () => {
    setFormMode("add");
    setSelectedLocationId(null);
    setFormData({
      full_address: "",
      latitude: "",
      longitude: "",
      website: "",
      is_default_location: false,
      start_time: "09:00:00",
      end_time: "17:00:00",
    });
    setShowForm(true);
  };

  // --- Custom Delete Modal Functions ---

  // Opens the custom delete confirmation modal.
  const openDeleteModal = (e, locationId) => {
    e.stopPropagation();
    setDeleteLocationId(locationId);
    setDeleteModalOpen(true);
  };

  // Closes the delete confirmation modal.
  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setDeleteLocationId(null);
  };

  // Called when the user confirms deletion.
  const handleConfirmDelete = async () => {
    try {
      const response = await fetchDelete(`${djangoBaseURL}/companies/${companyId}/multiple/locations/${deleteLocationId}/`);
      if (response.status) {
        toast.success("Location deleted successfully");
        fetchAddresses();
      } else {
        toast.error("Failed to delete location");
      }
    } catch (error) {
      console.error("Error deleting location:", error);
      toast.error("Error deleting location");
    } finally {
      closeDeleteModal();
    }
  };

  return (
    <div className="container mx-auto p-4 relative">
      {/* Header with title and top-right Add Location button */}
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Company Locations</h1>
        <button
          onClick={handleAddLocation}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
        >
          Add Location
        </button>
      </header>

      {dataFetchLoading ? (
        <div className="flex justify-center items-center h-64">
          <Icon icon="eos-icons:bubble-loading" className="text-xl animate-spin" />
        </div>
      ) : (
        <>
          {addresses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {addresses.map((location) => (
                <div
                  key={location.id}
                  className="cursor-pointer border rounded-lg p-4 shadow hover:shadow-lg transition duration-200 relative"
                  onClick={() => handleEditLocation(location)}
                >
                  <header className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      {/* Show a star badge if default; otherwise, show initials */}
                      <div className="flex-none">
                        {location.is_default_location ? (
                          <div className="h-10 w-10 rounded-md bg-yellow-500 text-white flex items-center justify-center font-bold">
                            <Icon icon="mdi:star" className="w-6 h-6" />
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded-md bg-slate-100 text-slate-900 dark:bg-slate-600 dark:text-slate-200 flex items-center justify-center font-normal capitalize">
                            {location.full_address
                              ? location.full_address.substring(0, 2).toUpperCase()
                              : ""}
                          </div>
                        )}
                      </div>
                      <div className="font-medium text-base leading-6">
                        <div className="dark:text-slate-200 text-slate-900 max-w-[160px] break-words">
                          {location.full_address}
                        </div>
                      </div>
                    </div>
                    {/* Delete icon */}
                    <div
                      onClick={(e) => openDeleteModal(e, location.id)}
                      className="cursor-pointer"
                    >
                      <Icon icon="heroicons-outline:trash" className="w-5 h-5 text-red-500" />
                    </div>
                  </header>
                  <div className="text-slate-600 dark:text-slate-400 text-sm pt-4">
                    <p className="break-words">Latitude: {location.latitude}</p>
                    <p className="break-words">Longitude: {location.longitude}</p>
                    <p className="break-words">Website: {location.website ? location.website : "N/A"}</p>
                    <p className="break-words">Start Time: {location.start_time}</p>
                    <p className="break-words">End Time: {location.end_time}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mb-4">No locations found.</p>
          )}
        </>
      )}

      {/* Modal for Add/Edit Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg w-11/12 md:w-1/2 lg:w-1/3 p-6">
            <h2 className="text-xl font-bold mb-4">
              {formMode === "add" ? "Add New Location" : "Edit Location"}
            </h2>

            <form onSubmit={handleFormSubmit}>
              <div className="mb-4">
                <label htmlFor="full_address" className="block text-gray-700 text-sm font-bold mb-2">
                  Full Address
                </label>
                <input
                  ref={autocompleteRef}
                  type="text"
                  id="full_address"
                  name="full_address"
                  placeholder="Enter full address"
                  value={formData.full_address}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mb-4">
                  <label htmlFor="latitude" className="block text-gray-700 text-sm font-bold mb-2">
                    Latitude
                  </label>
                  <input
                    type="text"
                    id="latitude"
                    name="latitude"
                    placeholder="Latitude"
                    value={formData.latitude}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="mb-4">
                  {/* The label for Longitude is already bold via font-bold */}
                  <label htmlFor="longitude" className="block text-gray-700 text-sm font-bold mb-2">
                    Longitude
                  </label>
                  <input
                    type="text"
                    id="longitude"
                    name="longitude"
                    placeholder="Longitude"
                    value={formData.longitude}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="website" className="block text-gray-700 text-sm font-bold mb-2">
                  Website
                </label>
                <input
                  type="text"
                  id="website"
                  name="website"
                  placeholder="Website"
                  value={formData.website}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="is_default_location"
                  name="is_default_location"
                  checked={formData.is_default_location}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <label htmlFor="is_default_location" className="text-gray-700 text-sm font-bold">
                  Default Location
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="start_time" className="block text-gray-700 text-sm font-bold mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    id="start_time"
                    name="start_time"
                    value={formData.start_time}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="end_time" className="block text-gray-700 text-sm font-bold mb-2">
                    End Time
                  </label>
                  <input
                    type="time"
                    id="end_time"
                    name="end_time"
                    value={formData.end_time}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {formLoading ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg w-11/12 md:w-1/3 p-6">
            <h3 className="text-lg font-bold mb-4">Confirm Deletion</h3>
            <p className="mb-6">Are you sure you want to delete this location?</p>
            <div className="flex justify-end">
              <button
                onClick={closeDeleteModal}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressSetting;

import React, { useState, useEffect } from "react";
import Card from "../ui/Card";
import { toast } from "react-toastify";
import { fetchAuthGET } from "@/store/api/apiSlice";
import Grid from "../skeleton/Grid";
import Carousel from "../ui/Carousel";
import { SwiperSlide } from "swiper/react";
import Button from "../ui/Button";
import { ImageCrousal } from "../partials/screenshot/ImageCrousal";
import { useNavigate, useParams } from "react-router-dom";

const ProjectScreenShot = ({ project }) => {
  const { projectId } = useParams();
  const today = new Date();
  const formattedToday = today.toISOString().split("T")[0];
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(formattedToday);
  const [screenshot, setScreenshot] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(null);
  const [modalImage, setModalImage] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjectScreenshots = async () => {
      try {
        setLoading(true);
        const {
          results: { data },
        } = await fetchAuthGET(
          `${
            import.meta.env.VITE_APP_DJANGO
          }/project/${projectId}/screenshots/${date}/${date}/`
        );
        setScreenshot(data);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };
    fetchProjectScreenshots();
  }, [projectId]);

  const imgUrl = screenshot.map((item) => item.url);

  return (
    <>
      <Card
        title={`Screenshot Summary For Today`}
        className="relative"
        headerslot={
          <Button
            text="View All"
            onClick={() => navigate(`/projects/screenshots/${project?._id}`)}
          />
        }
      >
        {loading ? (
          <Grid count="2" />
        ) : screenshot?.length === 0 ? (
          <p className="text-center">No screenshot found</p>
        ) : (
          <Carousel
            itemsToShow={1}
            pagination={true}
            navigation={true}
            className="main-caro"
          >
            {screenshot?.map((item, index) => (
              <SwiperSlide key={index}>
                <div
                  className="single-slide bg-no-repeat bg-cover bg-center rounded-md min-h-[300px] w-full h-full cursor-pointer"
                  style={{
                    backgroundImage: `url(${item.url})`,
                  }}
                  onClick={() => {
                    setCurrentImageIndex(index);
                    setModalImage(true);
                  }}
                ></div>
              </SwiperSlide>
            ))}
          </Carousel>
        )}
      </Card>

      {modalImage && (
        <ImageCrousal
          imageList={imgUrl}
          initialSlide={currentImageIndex}
          closeModal={() => setModalImage(false)}
        />
      )}
    </>
  );
};

export default ProjectScreenShot;

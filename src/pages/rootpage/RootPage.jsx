import React, { lazy, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import prpwebslogo from '../../assets/images/logo/prp-logo.png'
import vsflogo from '../../assets/images/logo/VSF-Logo.webp'
import seogrowthlogo from './images/seogrowthlogo.webp'
import alchemyleadslogo from './images/alchemyleadslogo.webp'
import trustbadge from './images/trustbadge4.webp'
import manishsharma from './images/manish-sharma.webp'
import monthlysummmary from './images/monthly-summmary.webp'
import monthlysummmarymobile from './images/monthly-summmary-mo.webp'
import sean from './images/sean-img.webp'
import featureTwo from './images/featureTwo.webp'
import featureTwomobile from './images/featureTwo-mo.webp'
import grish from './images/grish-img.webp'
import featureThree from './images/featureThree.webp'
import featureThreemobile from './images/featureThree-mo.webp'
import aaron from './images/aaron-img.webp'
import featureFour from './images/featureFour.webp'
import featureFourmobile from './images/featureFour-mo.webp'
import bottomcharacter from './images/bottomcharacter.webp'
import bottomsectionbg from './images/bottomsectionbg.webp'
import TimeTracking from './images/Time-tracking.png';
import AutomaticReport from '../../assets/images/icons/automatic-report.png';
import TaskManagement from '../../assets/images/icons/task-mangement.png';
import CreateTask from '../../assets/images/create_task.png';
import TimeLog from '../../assets/images/time_log.webp';
import TimeSheet from '../../assets/images/timesheet.webp';
import './style.css'
const Header = lazy(() => import('./Header'));
const Footer = lazy(() => import('./Footer'));
const HeroSection = lazy(() => import('./HeroSection'));
const Tidio = lazy(() => import('./Tidio'));
import { useExitIntent } from 'use-exit-intent';
import { useNavigate } from "react-router-dom";

const RootPage = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const { registerHandler, unsubscribe } = useExitIntent();
  const navigate = useNavigate();

  const validateEmail = () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleEmailSubmit = () => {
    if (!validateEmail()) {
      setError("Please enter a valid email address");
      return;
    }
    setError("");
    navigate("/user-register", { state: { email } });
  };

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [modalImg, setModalImg] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 460);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  // Unsubscribe from exit intent on unmount
  React.useEffect(() => {
    return () => unsubscribe();
  }, [unsubscribe]);


  useEffect(() => {
    const faqQuestions = document.querySelectorAll('.faq-question');

    faqQuestions.forEach(question => {
      question.addEventListener('click', () => {
        const answer = question.nextElementSibling;

        faqQuestions.forEach(q => {
          const currentAnswer = q.nextElementSibling;
          if (currentAnswer && currentAnswer !== answer) {
            currentAnswer.classList.remove('active');
            q.classList.remove('active');
            const currentIcon = q.querySelector('span');
            if (currentIcon && currentIcon.textContent === '−') {
              currentIcon.textContent = '+';
            }
          }
        });

        question.classList.toggle('active');
        if (answer) {
          answer.classList.toggle('active');
        }

        const icon = question.querySelector('span');
        if (icon) {
          icon.textContent = icon.textContent === '+' ? '−' : '+';
        }
      });
    });

    // Clean up event listeners on unmount
    return () => {
      faqQuestions.forEach(question => {
        question.removeEventListener('click', () => { });
      });
    };
  }, []);

  return (
    <div className="bg-white">
      <Helmet>
        <title>Task Management with Time Tracking & Screenshots | Dyzo</title>
        <meta name="description" content="Task management, automatic time tracking, and screenshot monitoring for productive remote teams." />
        <meta name="keywords" content="task management software, time tracking app, screenshot monitoring, employee monitoring, remote team productivity, team task tracker, automatic time tracking, project management for remote teams, productivity software, Dyzo" />
        <meta property="og:title" content="Task Management with Time Tracking & Screenshots | Dyzo" />
        <meta property="og:description" content="Task management, automatic time tracking, and screenshot monitoring for productive remote teams." />
        <meta property="og:url" content="https://dyzo.ai" />
      </Helmet>
      <Header />
      <Tidio />
      <HeroSection />


      <section className="my-8 md:my-12">
        <div className="p-4 max-w-[1320px] w-full mx-auto px-[30px] mt-10">
          <div className="p-6 md:p-14  rounded-lg w-full max-w-[1020px] mx-auto bg-[#edf1f5]">
            <h1 className="text-xl md:text-4xl font-bold text-center mb-6 dark:text-black-500">Teams that trust Dyzo</h1>
            <div className="grid grid-cols-5 gap-8 justify-items-center max-w-fit m-auto items-center ">
              <img src={prpwebslogo} alt="prpwebs" className="w-[35px] h-18 grayscale" width="35px" height="55px" loading="lazy"  />
              <img src={seogrowthlogo} alt="seo growth" className="w-[60px] h-18 grayscale" width="60px" height="40px" loading="lazy" />
              <img src={alchemyleadslogo} alt="alchemyleads" className="w-[70px] h-18 grayscale" width="70px" height="54px" loading="lazy" />
              <img src={trustbadge} alt="trustbadge" className="w-[60px] h-18 grayscale" width="60px" height="45px" loading="lazy" />
              <img src={vsflogo} alt="VSF Marketing" className="w-[100px] h-18 grayscale" width="100px" height="24px" loading="lazy" />
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="featuresMain-wrapper bg-white">
        <div className="container">
          <div className="featuresRightBox">
            {isMobile ? (
              <img src={monthlysummmarymobile} alt="Dyzo Info Image" width="390px" height="357px" loading="lazy" />
            ) : (
              <img src={monthlysummmary} alt="Dyzo Info Image" width="1222px" height="1108px" />
            )}
          </div>
          <div className="featuresleftBox">
            <p className="featureCount">01.</p>
            <h2 className="dark:text-black-500">Task Management with <span className="highlightText">Automatic Time Tracking</span></h2>
            <p className="featuresSubHeading">
              Streamline your workflow with automated time tracking and task management tools that help teams stay productive and focused.
            </p>

            <div className="FeaturesTestimonialBox">
              <p>"With Dyzo, our team’s efficiency has skyrocketed. We’re able to focus on what matters without getting bogged down by administrative tasks."</p>
              <div className="fTestimonialInfoBox">
                <img src={manishsharma} width="40px" height="auto" alt="Manish Sharma" loading="lazy" />
                <p className="authorNameInfo">
                  Manish Sharma <br /><span>SEO Growth</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="container">
          <div className="featuresleftBox">
            <p className="featureCount">02.</p>
            <h2 className="dark:text-black-500">Screenshot Monitoring for <span className="highlightText">Remote Teams</span></h2>
            <p className="featuresSubHeading">
              Keep track of work progress with automatic screenshots, helping remote teams stay accountable and productive.
            </p>

            <div className="FeaturesTestimonialBox">
              <p>"Dyzo has simplified our HR processes, making it easier for us to manage employee requests and keep everything organized."</p>
              <div className="fTestimonialInfoBox">
                <img src={sean} width="40px" height="auto" alt="Sean Choudhary" loading="lazy" />
                <p className="authorNameInfo">
                  Sean Choudhary <br /><span>Alchemyleads</span>
                </p>
              </div>
            </div>
          </div>
          <div className="featuresRightBox">
            {isMobile ? (
              <img src={featureTwomobile} alt="Dyzo Info Image" width="390px" height="357px" loading="lazy" />
            ) : (
              <img src={featureTwo} alt="Dyzo Info Image" width="1703px" height="1560px" loading="lazy" />
            )}
          </div>
        </div>


        <div className="container">
          <div className="featuresRightBox">
            {isMobile ? (
              <img src={featureThreemobile} alt="Dyzo Info Image" width="390px" height="357px" loading="lazy" />
            ) : (
              <img src={featureThree} alt="Dyzo Info Image" width="1702px" height="1569px" loading="lazy" />
            )}
          </div>
          <div className="featuresleftBox">
            <p className="featureCount">03.</p>
            <h3 className="dark:text-black-500">Integrate Seamlessly <span className="highlightText">Work Effortlessly</span></h3>
            <p className="featuresSubHeading">With Dyzo, you get powerful tools that keep your projects moving forward, on time, and with less effort.Dyzo simplifies HR management, helping you keep track of what matters—your people.
            </p>

            <div className="FeaturesTestimonialBox">
              <p>"The integration capabilities of Dyzo have streamlined our operations, allowing us to work smarter, not harder."</p>
              <div className="fTestimonialInfoBox">
                <img src={grish} width="40px" height="auto" alt="Girish" loading="lazy" />
                <p className="authorNameInfo">
                  Girish <br /><span>Markathon</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="container border-none">
          <div className="featuresleftBox">
            <p className="featureCount">04.</p>
            <h3 className="dark:text-black-500">Monitor Productivity <span className="highlightText">with Automated Screenshots</span></h3>
            <p className="featuresSubHeading">
              Stay informed about your team's activities without constant oversight. Dyzo automatically takes periodic screenshots, giving you a clear view of work in progress and helping you ensure tasks are on track.
            </p>

            <div className="FeaturesTestimonialBox">
              <p>"Dyzo’s screenshot feature has been a game-changer for our remote team. We can now monitor work in real-time without interrupting workflows."
              </p>
              <div className="fTestimonialInfoBox">
                <img src={aaron} width="40px" height="auto" alt=" Aaron Hulbort" loading="lazy" />
                <p className="authorNameInfo">
                  Aaron Hulbort <br /><span>VSF Marketing</span>
                </p>
              </div>
            </div>
          </div>

          <div className="featuresRightBox">
            {isMobile ? (
              <img src={featureFourmobile} alt="Dyzo Info Image" width="390px" height="357px" loading="lazy" />
            ) : (
              <img src={featureFour} alt="Dyzo Features" width="1222px" height="1108px" loading="lazy" />
            )}
          </div>
        </div>
      </section>


      <section id="insights" className="InsightMainBox-wrapper">
        <div className="container">
          <h2 className="leading-[1.2] dark:text-black-500  ">How it works<span className="highlightText"></span> <br /><span className="highlightText"> Plan, Track, Report — All with Dyzo.</span> </h2>

          <div className="InsightMainBoxs-container">
            <div className="InsightBox InsightBox1 bg-[#f9faff]">
              <img
                src={CreateTask}
                width="55px"
                height="55px"
                alt="Task Creation"
                loading="lazy"
                style={{ cursor: "pointer" }}
                onClick={e => {
                  e.preventDefault(); // Prevent any default link behavior
                  setModalImg(CreateTask);
                }}
              />
              <div>
                <h4 className="dark:text-black-500">Create Task</h4>
                <p>Create and organize tasks effortlessly with smart, customizable and templates.</p>
              </div>
            </div>

            <div className="InsightBox InsightBox2">
              <img
                src={TimeLog}
                width="55px"
                height="55px"
                alt="Time Log"
                loading="lazy"
                style={{ cursor: "pointer" }}
                onClick={() => setModalImg(TimeLog)}
              />
              <div>
                <h4 className="dark:text-black-500">Time Log </h4>
                <p>Effortlessly sync work hours using Dyzo’s lightweight desktop time tracker. </p>
              </div>
            </div>

            <div className="InsightBox InsightBox3">
              <img
                src={TimeSheet}
                width="55px"
                height="55px"
                alt="Automated Report"
                loading="lazy"
                style={{ cursor: "pointer" }}
                onClick={() => setModalImg(TimeSheet)}
              />
              <div>
                <h4 className="dark:text-black-500">Automated Report</h4>
                <p>Generate and share insightful reports with just a few clicks. </p>
              </div>
            </div>
          </div>

          <div className="py-6 flex justify-center">
            <a href="/register" className="Book-a-demo-btn" >Get Started Now</a>
          </div>


        </div>
      </section>

      <section className="faqSection-main">
        <h3 className="dark:text-black-500">Frequently Asked <span className="highlightText">Questions</span></h3>

        <div className="faqContainer-main">

          <div className="faq-item border-b mb-2">
            <button className="faq-question">Can I cancel my subscription anytime? <span>+</span></button>
            <div className="faq-answer">
              <p>Yes, you can! We have a no-questions-asked cancellation policy.</p>
            </div>
          </div>

          <div className="faq-item border-b mb-1">
            <button className="faq-question">Do I need to download the app to track time? <span>+</span></button>
            <div className="faq-answer">
              <p>No, you don’t have to. But downloading the app helps you take screenshots and see live tracking of your team.</p>
            </div>
          </div>

          <div className="faq-item border-b mb-1">
            <button className="faq-question">Will I be charged if one of my staff leaves? <span>+</span></button>
            <div className="faq-answer">
              <p>No, you won’t be charged for that staff member starting from the next billing month. However, if they leave in the middle of the month, there won't be a refund for that month. You'll only stop being charged for them the following month.</p>
            </div>
          </div>

          <div className="faq-item border-b mb-1">
            <button className="faq-question">How can Dyzo be so affordable? <span>+</span></button>
            <div className="faq-answer">
              <p>Dyzo is affordable because we optimise our software and operate our data centres in India, allowing us to save costs compared to Western data centres.</p>
            </div>
          </div>

          <div className="faq-item border-b mb-1">
            <button className="faq-question">Will I get my money back if I don’t like Dyzo after I’ve already paid? <span>+</span></button>
            <div className="faq-answer">
              <p>No, we don’t offer refunds. However, we provide a generous feature set and a 30-day free trial so you can try Dyzo before committing.</p>
            </div>
          </div>

          <div className="faq-item border-b mb-1">
            <button className="faq-question">Do you provide any white-labelling solutions? <span>+</span></button>
            <div className="white-label faq-answer">
              <p>No, we don’t offer white-labelling. We keep it simple for onboarding and use.</p>
            </div>
          </div>

          <div className="faq-item border-b mb-1">
            <button className="faq-question">Will my data be saved if I don't upgrade on time after my free trial? <span>+</span></button>
            <div className="faq-answer">
              <p>We will do our best to keep your data safe, but we can’t guarantee it. To ensure your data remains intact, we recommend upgrading before the trial ends.</p>
            </div>
          </div>

        </div>
      </section>


      <section className="bottomCtaMain-wrapper relative overflow-hidden">
        <img src={bottomsectionbg} className='absolute bg-img-bottomtamain' alt="Dyzo Info Image" width="1920px" height="488px" loading="lazy" />

        <div className="container bottomCtaMain-container">
          <div>
            <h3 className="dark:text-black-500">Manage your Projects, Tasks and <br /> Reports with ease</h3>

            <a className="bottomCta CtaStyle " href="/register">Try DYZO Today</a>
            <span>Get Started for free, no credit card required.</span>
          </div>

          <img src={bottomcharacter} className="bottomcharacter-img" width="415px" height="266px" alt="Character" loading="lazy" />
        </div>
      </section>

      {modalImg && (
        <div className="modal-backdrop" onClick={() => setModalImg(null)}>
          <img src={modalImg} alt="Preview" className="modal-img" />
        </div>
      )}

      <Footer />

    </div>

  );
};

export default RootPage;
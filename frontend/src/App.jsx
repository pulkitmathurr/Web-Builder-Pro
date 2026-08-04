import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Pages
import Login from './pages/auth/Login';
import SuperAdminLogin from './pages/auth/SuperAdminLogin';

// Super Admin
import SuperAdminDashboard from './pages/superAdmin/Dashboard';
import ManageSchools from './pages/superAdmin/ManageSchools';
import CreateSchool from './pages/superAdmin/CreateSchool';

// Admin
import AdminDashboard from './pages/admin/Dashboard';
import ModuleSelector from './pages/admin/ModuleSelector';
import AdminSettings from './pages/admin/Settings';
import ModulePage from './pages/admin/ModulePage';
import ContactUs from './pages/admin/ContactUs';
import HomePage from './pages/admin/modules/HomePage';
import AboutUs from './pages/admin/modules/AboutUs';
import FeeStructure from './pages/admin/modules/FeeStructure';
import Courses from './pages/admin/modules/Courses';
import Faculty from './pages/admin/modules/Faculty';
import Infrastructure from './pages/admin/modules/Infrastructure';
import Sports from './pages/admin/modules/Sports';
import Gallery from './pages/admin/modules/Gallery';
import Achievements from './pages/admin/modules/Achievements';
import Alumni from './pages/admin/modules/Alumni';
import PublicDisclosure from './pages/admin/modules/PublicDisclosure';
import TCInformation from './pages/admin/modules/TCInformation';
import Announcements from './pages/admin/modules/Announcements';
import Events from './pages/admin/modules/Events';
import Circulars from './pages/admin/modules/Circulars';
import Calendar from './pages/admin/modules/Calendar';
import AdmissionEnquiry from './pages/admin/modules/AdmissionEnquiry';
import CareerEnquiry from './pages/admin/modules/CareerEnquiry';
// School Website
import SchoolWebsite from './pages/school/SchoolWebsite';
import AboutUsPublic from './pages/school/AboutUsPublic';
import FeeStructurePublic from './pages/school/FeeStructurePublic';
import CoursesPublic from './pages/school/CoursesPublic';
import SchoolNotFound from './pages/school/SchoolNotFound';
import FacultyPublic from './pages/school/FacultyPublic';
import SchoolLevelPublic from './pages/school/SchoolLevelPublic';
import InfrastructurePublic from './pages/school/InfrastructurePublic';
import GalleryPublic from './pages/school/GalleryPublic';
import SportsPublic from './pages/school/SportsPublic';
import AchievementsPublic from './pages/school/AchievementsPublic';
import AlumniPublic from './pages/school/AlumniPublic';
import PublicDisclosurePublic from './pages/school/PublicDisclosurePublic';
import TCInformationPublic from './pages/school/TCInformationPublic';
import AnnouncementsPublic from './pages/school/AnnouncementsPublic';
import AnnouncementDetailPublic from './pages/school/AnnouncementDetailPublic';
import EventsPublic from './pages/school/EventsPublic';
import EventDetailPublic from './pages/school/EventDetailPublic';
import CircularsPublic from './pages/school/CircularsPublic';
import CircularDetailPublic from './pages/school/CircularDetailPublic';
import CalendarPublic from './pages/school/CalendarPublic';
// Layouts
import SuperAdminLayout from './layouts/SuperAdminLayout';
import AdminLayout from './layouts/AdminLayout';

// Protected Route
import ProtectedRoute from './components/common/ProtectedRoute';
import EnquiryWidget from './components/public/EnquiryWidget';

function App() {
    return (
        <BrowserRouter>
            <Toaster position="top-right" />
            <EnquiryWidget />
            <Routes>

                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/super-admin/login" element={<SuperAdminLogin />} />
                <Route path="/" element={<Navigate to="/login" replace />} />

                {/* Public School Website */}
                <Route path="/school/:slug" element={<SchoolWebsite />} />
                <Route path="/school/:slug/about" element={<AboutUsPublic />} />
                <Route path="/school/:slug/fee" element={<FeeStructurePublic />} />
                <Route path="/school/:slug/faculty" element={<FacultyPublic />} />
                <Route path="/school/:slug/infrastructure/:categorySlug" element={<InfrastructurePublic />} />
                <Route path="/school/:slug/infrastructure" element={<InfrastructurePublic />} />
                <Route path="/school/:slug/sports/:pageSlug" element={<SportsPublic />} />
                <Route path="/school/:slug/sports" element={<SportsPublic />} />
                <Route path="/school/:slug/gallery/:tab" element={<GalleryPublic />} />
                <Route path="/school/:slug/gallery" element={<GalleryPublic />} />
                <Route path="/school/:slug/achievements" element={<AchievementsPublic />} />
                <Route path="/school/:slug/alumni" element={<AlumniPublic />} />
                <Route path="/school/:slug/public-disclosure" element={<PublicDisclosurePublic />} />
                <Route path="/school/:slug/tc" element={<TCInformationPublic />} />
                <Route path="/school/:slug/announcements/:id" element={<AnnouncementDetailPublic />} />
                <Route path="/school/:slug/announcements" element={<AnnouncementsPublic />} />
                <Route path="/school/:slug/events/:id" element={<EventDetailPublic />} />
                <Route path="/school/:slug/events" element={<EventsPublic />} />
                <Route path="/school/:slug/circulars/:id" element={<CircularDetailPublic />} />
                <Route path="/school/:slug/circulars" element={<CircularsPublic />} />
                <Route path="/school/:slug/calendar" element={<CalendarPublic />} />
                <Route path="/school/:slug/:levelSlug" element={<SchoolLevelPublic />} />
                <Route path="/school-not-found" element={<SchoolNotFound />} />

                {/* Super Admin Protected Routes */}
                <Route path="/super-admin" element={
                    <ProtectedRoute allowedRole="super_admin">
                        <SuperAdminLayout />
                    </ProtectedRoute>
                }>
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<SuperAdminDashboard />} />
                    <Route path="schools" element={<ManageSchools />} />
                    <Route path="schools/create" element={<CreateSchool />} />
                </Route>

                {/* Admin Protected Routes */}
                <Route path="/admin" element={
                    <ProtectedRoute allowedRole="admin">
                        <AdminLayout />
                    </ProtectedRoute>
                }>
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="modules/select" element={<ModuleSelector />} />
                    <Route path="settings" element={<AdminSettings />} />
                    <Route path="contact" element={<ContactUs />} />
                    {/* Specific module routes pehle */}
                    <Route path="module/home" element={<HomePage />} />
                    <Route path="module/about" element={<AboutUs />} />
                    <Route path="module/fee" element={<FeeStructure />} />
                    <Route path="module/courses" element={<Courses />} />
                    <Route path="module/faculty" element={<Faculty />} />
                    <Route path="module/infrastructure" element={<Infrastructure />} />
                    <Route path="module/sports" element={<Sports />} />
                    <Route path="module/gallery" element={<Gallery />} />
                    <Route path="module/achievements" element={<Achievements />} />
                    <Route path="module/alumni" element={<Alumni />} />
                    <Route path="module/disclosure" element={<PublicDisclosure />} />
                    <Route path="module/tc" element={<TCInformation />} />
                    <Route path="module/announcements" element={<Announcements />} />
                    <Route path="module/events" element={<Events />} />
                    <Route path="module/circulars" element={<Circulars />} />
                    <Route path="module/calendar" element={<Calendar />} />
                    <Route path="module/admission" element={<AdmissionEnquiry />} />
                    <Route path="module/career" element={<CareerEnquiry />} />
                    {/* Generic module route baad mein */}
                    <Route path="module/:moduleKey" element={<ModulePage />} />
                </Route>

                {/* 404 */}
                <Route path="*" element={<Navigate to="/login" replace />} />

            </Routes>
        </BrowserRouter>
    );
}

export default App;
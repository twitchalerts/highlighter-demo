import { ReactNode, useState } from "react";
import { VideoList } from "../components/VideoList";

interface MainLayoutProps {
    children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <div className="flex h-screen">
            {/* Sidebar */}
            <div
                className={`bg-gray-200 w-96 flex-none ${
                    isSidebarOpen ? 'block' : 'hidden'
                }`}
            >
                <VideoList />
            </div>

            {/* Main content */}
            <div className="flex-grow p-4">
                {children}
            </div>
        </div>
    );
};
    

   
export default MainLayout;

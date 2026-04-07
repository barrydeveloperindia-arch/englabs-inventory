import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export const startTour = () => {
    const driverObj = driver({
        showProgress: true,
        steps: [
            { popover: { title: 'Welcome to ENGLABS INVENTORY', description: 'This is your new Command OS. Let\'s take a quick tour to get you oriented.' } },
            { element: '#nav-item-dashboard', popover: { title: 'Command Center', description: 'Your main dashboard. View real-time sales, inventory value, and staff attendance at a glance.' } },
            { element: '#nav-item-sales', popover: { title: 'Terminal Sales', description: 'Process transactions here. Use this for checkout and managing the till.' } },
            { element: '#nav-item-inventory', popover: { title: 'Inventory Management', description: 'Track stock levels, add new products, and manage suppliers.' } },
            { element: '#nav-item-staff', popover: { title: 'Staff & Rota', description: 'Manage your team, view the rota, and approve leave requests.' } },
            { element: '#nav-item-financials', popover: { title: 'Financials', description: 'Deep dive into your profit & loss, expenses, and ledger entries.' } },
            { element: '#nav-footer-support', popover: { title: 'Need Help?', description: 'Click here anytime to view system info or contact support.' } },
        ]
    });

    driverObj.drive();
};

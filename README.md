<a id="readme-top"></a>
![image](https://github.com/user-attachments/assets/1c514d96-ffab-459d-aff8-07aef5d505c5)

# 🌾 Pleasant Grove Farms Inventory Management

An inventory tracking and management system built for Pleasant Grove Farms to streamline product data, storage, mill output, and sales.

![Next.js](https://img.shields.io/badge/Next.js-13-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-ORM-green)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-blue)
![Status](https://img.shields.io/badge/Status-In_Progress-yellow)

Our team the Syntax Stingers are building a simple and efficient inventory management system for Pleasant Grove Farms. Their current process relies on the management of spreadsheets. This makes it difficult to keep track of what they have in stock. Our system will make it easier for them by having everything they need in an intuitive and organized interface.

Key solutions:

* 🧠 A clean, easy-to-use dashboard to view and update inventory
* 🔄 Real-time updates so users always know what's in stock
* 👥 Separate access levels for admins and regular users help maintain security
* 🗃️ A reliable database to store all their product, user, and sales data
* 🔐 Includes a secure login system with password protection

What makes our team’s solution unique:

 * No unnecessary complexity
 * Next.js and PostgreSQL for speed and reliability
 * Serverless — cheaper to host and easier to maintain
 * Designed to grow with their needs — we can always add more features later

<details>
  <summary>Table of Contents</summary>
  <ol>
    <li><a href="#technologies">🛠 Technologies</a></li>
    <li><a href="#features">✨ Features</a></li>
    <li><a href="#front-end-visuals">🎨 Front End Visuals</a></li>
    <li><a href="#back-end-visuals">🧠 Back End Visuals</a></li>
    <li><a href="#developer-instructions">🧪 Developer Instructions</a></li>
    <li><a href="#testing">🧪 Testing</a></li>
    <li><a href="#deployment">🚀 Deployment</a></li>
    <li><a href="#contributors">👥 Contributors</a></li>
  </ol>
</details>

## 💡 Why This Matters

Pleasant Grove Farms currently uses spreadsheets to manage over 3,000 acres of certified organic crop data. Our solution replaces this with a centralized, secure system that supports faster decisions, minimizes data loss, and boosts productivity. This app makes that transition seamless.

## Technologies
* [![React][React.js]][React-url]
* [![Next][Next.js]][Next-url]
* [![PostgreSQL][PostgreSQL.js]][PostgreSQL-url]
* [![Vercel][Vercel.js]][Vercel-url]
* [![Tailwind][Tailwind.js]][Tailwind-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>


## ✨Features
- Admin login and role-based access
- Inventory CRUD (Create, Read, Update, Delete)
- Mill Job tracking and outputs
- Search by year, location, and product
- Transfer and location update pages
- ERD-based database structure

  
## Front End Visuals
Here are some visuals from our product:<br>
<details>
  <summary>Visuals</summary>
  <ol>
    <li><a href="#login-page-">Login Page</a></li>
    <li><a href="#employee-menu-">Employee Menu</a></li>
    <li><a href="#admin-menu-">Admin Menu</a></li>
    <li><a href="#new-field-run-">New Field Run</a></li>
    <li><a href="#transfer-">Transfer</a></li>
    <li><a href="#update-location-">Update Location</a></li>
    <li><a href="#adddelete-items-">Add/Delete Items</a></li>
    <li><a href="#create-job-">Create Job</a></li>
    <li><a href="#mixing-job-">Mixing Job</a></li>
    <li><a href="#qsage-job-">Qsage Job</a></li>
    <li><a href="#sortex-job-">Sortex Job</a></li>
    <li><a href="#bagging-job-">Bagging Job</a></li>
    <li><a href="#in-process-">In Processs</a></li>
    <li><a href="#job-history-">Job History</a></li>
    <li><a href="#storage-dashboard-">Storage Dashboard</a></li>
    <li><a href="#field-run-storage-">Field Run Storage</a></li>
    <li><a href="#screening-storage-">Screening Storage</a></li>
    <li><a href="#clean-storage-">Clean Storage</a></li>
    <li><a href="#search-">Search</a></li>
    <li><a href="#reports-">Reports</a></li>
    <li><a href="#orders-">Orders</a></li>
    <li><a href="#crop-menu-">Crop Menu</a></li>
  </ol>
</details>

### Login Page: <br>
This is the landing page where users can log in using their email and password.
<img width="1915" height="913" alt="Image" src="https://github.com/user-attachments/assets/7d737a41-f881-4e60-897c-e54f43534293" />

### Employee Menu: <br>
The employee menu provides access to limited functionality, including the New Field Run, Transfer, Jobs, and Update Location pages.

### Admin Menu: <br>
The admin menu includes all employee features plus administrative tools such as adding and deleting locations, products, sale items, and users.

### New Field Run: <br>
This page allows users to record a new field run — an incoming load of product from the fields.

### Transfer: <br>
Used to transfer a specified weight of product between storage silos.

### Update Location: <br>
Allows users to update the current storage location of ...

### Add/Delete Items: <br>
Provides admins with tools to add or remove storage locations, customers, or other configurable items.

### Create Job: <br>
Enables admins to create and schedule new jobs for later execution.

### Mixing Job: <br>
Used by admins to run a mixing job involving two product boxes.

### Qsage Job: <br>
Allows admins to run, record, and complete a Qsage job.

### Sortex Job: <br>
Allows admins to run, record, and complete a Qsage job.

### Bagging Job: <br>
Enables admins to manage and record bagging operations for finished products.

### In Process: <br>
Displays all active or ongoing jobs currently being processed.

### Job History: <br>
Provides a history of all completed jobs with detailed records.

### Storage Dashboard: <br>
Displays navigation to all storage categories, including field run, screening, and clean storage.

### Field Run Storage: <br>
Lists all field run storage locations along with their current contents.

### Screening Storage: <br>
Displays screening storage items organized by box ID, with search functionality for lot numbers.

### Clean Storage: <br>
Lists clean storage items organized by product, with search filters for lot numbers.

### Search: <br>
Allows admins to search by lot number, location, or product, with optional filters for year and product type.

### Reports: <br>
Displays all available reports for completed jobs. Admins can search by process ID, lot number, or product.

### Orders: <br>
Allows admins to create, update, and complete orders, as well as view all active and completed orders.

### Crop Menu: <br>
Provides options for admins to add or remove products (crops) and manage dropdown availability — for example, removing a crop that is out of season.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Back End Visuals
This is our Entity Relationship Diagram:

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Developer Instructions
How to download and setup to run.
<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Testing 
Links or a description of how to test.
<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Deployment 
How to deploy the app.
<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Contributors
[![Contributors](https://contrib.rocks/image?repo=Mujahidshafi/PG_Inventory_Management)](https://github.com/Mujahidshafi/PG_Inventory_Management/graphs/contributors)

### Team Contacts

- [Mujahid Shafi](https://github.com/Mujahidshafi) — [Email](mailto:muja.shafi@gmail.com)
- [Amber Aring](https://github.com/aaring25) — [Email](mailto:aring.amber@gmail.com)
- [Purity Maina](https://github.com/p-maina) — [Email](mailto:puritymainam@gmail.com)
- [Gene Arellano](https://github.com/genearellano) — [Email](mailto:kenare1431@gmail.com)
- [Anjoe Mateo](https://github.com/anmateo) — [Email](mailto:useramateo@gmail.com)
- [Lamba Mujadedi](https://github.com/lambamojo) — [Email](mailto:lambamojo123@gmail.com)
- [Subhanullah Lalzai](https://github.com/Subhan-4) — [Email](mailto:subhanullahmomand3@gmail.com)
- [Hamzah Ramzan](https://github.com/Bahamas360) — [Email](mailto:mramzan331@gmail.com)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

[Next.js]: https://img.shields.io/badge/next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white
[Next-url]: https://nextjs.org/
[React.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://reactjs.org/
[PostgreSQL.js]: https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white
[PostgreSQL-url]: https://www.postgresql.org/
[Vercel.js]: https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white
[Vercel-url]: https://vercel.com/
[Tailwind.js]: https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white
[Tailwind-url]: https://tailwindcss.com/

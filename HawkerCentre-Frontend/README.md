# HawkerCentre-Frontend

HawkerHub is a responsive front-end demonstration for a Singapore Hawker Centre Management System. It was built with HTML5, CSS3 and vanilla JavaScript. There is no framework, build tool, database or real payment service.

## Important academic note

The FED assignment write-out warns that substantially AI-generated work submitted as a student's own work may be treated as academic misconduct. Study every feature, test it yourself, replace the placeholder team details, verify the sample information and make meaningful changes that you can explain during the evaluation session.

## Main features

- Local customer, vendor and guest account simulation
- Role-based navigation and page protection
- Hawker-centre search by town, location, centre name and MRT
- OpenStreetMap Nominatim location confirmation with a safe local fallback
- Centre-to-stall-to-menu navigation using query parameters and localStorage
- Stall search, cuisine filter, hygiene-grade filter and sorting
- Hygiene-grade history with inspection details
- Dynamic menus with search, category filter, price sorting, likes, add-ons and quantity controls
- Multi-stall cart, checkout simulation, order result, progress tracking and history
- Crowd estimates based on time of day with refresh and timestamps
- Feedback, ratings, complaints and promotion application
- Vendor dashboard, menu CRUD, rental records and Canvas sales charts
- Responsive layout, keyboard controls, labels, focus states and text-based statuses
- Credits page and image-replacement instructions

## Folder structure

```text
HawkerCentre-Frontend/
├── index.html
├── README.md
├── html/       Page files
├── css/        One matching stylesheet per page plus shared.css
├── js/         One matching script per page plus shared.js
└── img/        Image instructions
```

All page filenames use lowercase kebab-case. Every HTML page has a matching CSS and JavaScript file.

## Run with Live Server

1. Open the `HawkerCentre-Frontend` folder in Visual Studio Code.
2. Install the Live Server extension if it is not already installed.
3. Open `index.html`.
4. Right-click inside the editor and select **Open with Live Server**.
5. `index.html` redirects to `html/login.html`.

You can also click the visible **Continue to Login** fallback link if JavaScript is disabled.

Do not open the files using a `file:///` URL when testing the location API. Live Server provides the HTTP origin required for reliable browser requests.

## Demo accounts

These credentials are only for the local front-end demonstration. Do not use or store a real password.

| Role | Email | Password |
| --- | --- | --- |
| Customer | `customer@demo.sg` | `Customer123` |
| Vendor | `vendor@demo.sg` | `Vendor123` |

The login form role must match the account. A registered local account is saved only in the current browser.

## Guest mode

Choose **Continue as Guest** from the login page. Guest users can browse centres, check crowds, use the menu and cart, place simulated orders, view locally saved order history and submit engagement forms. Guest information disappears if browser storage is cleared.

## localStorage

The demonstration uses these main keys:

- `hc.users`
- `hc.currentUser`
- `hc.role`
- `hc.selectedCentre`
- `hc.selectedStall`
- `hc.cart`
- `hc.orders`
- `hc.feedback`
- `hc.complaints`
- `hc.likes`
- `hc.promotions`
- `hc.crowdLevels`
- `hc.menuItems`
- `hc.ratings`

Use the browser developer tools under **Application → Local Storage** to inspect or clear the demo data. The default sample data is created again when the project next loads.

## Sample and simulated data

The stalls, menus, prices, ratings, promotions, crowd levels, hygiene records, orders, rental agreement and analytics data are demonstration data. Centre names and addresses must be checked against official sources before school submission.

Crowd percentages are estimated from a centre's demo baseline, current time and a small refresh variation. They are not live occupancy readings.

Payment choices are simulated. The website never contacts a bank or processes real money.

## API integration

The Browse Hawker Centres page uses `fetch()`, `async/await` and `try/catch` to query the public Nominatim geocoding service for a Singapore location match:

- Loading status is displayed.
- Non-successful responses are handled.
- A friendly message is shown if the request fails.
- Centre search continues using local sample data.
- No private API key is required or exposed.

The credits page links to Nominatim and OpenStreetMap attribution.

## Replace images

The project uses styled CSS placeholders so no broken external image is required. Read `img/README.txt`, add properly licensed images to `img/`, update the relevant JavaScript data or HTML, add meaningful alt text and record every source on `html/credit.html`.

## Known limitations

- Data is saved per browser and per device only.
- Passwords are plain local demonstration values, not secure authentication.
- Crowd, hygiene, sales, order and rental information is simulated.
- Location lookup needs an internet connection, but local search works without it.
- No real bank, NETS or PayNow service is connected.
- Canvas charts are intentionally lightweight and do not use a chart framework.
- The project does not provide multi-user server synchronisation.

## Before final submission

- Replace the developer/team placeholders on the Credits page.
- Verify centre information and add authoritative source credits.
- Add and credit any images used.
- Validate the final HTML and CSS.
- Test every route using Live Server on mobile and desktop widths.
- Commit your own understood changes regularly with meaningful Git messages.
- Ensure every team member can explain their individual feature during the video and evaluation.

const API_BASE = '/api/hawkercentres';

// Adjust this to whatever your existing stalls listing page is actually
// called — per the "point to the same stalls" simplification, every
// hawker centre result links to the SAME stalls page, not a filtered one.
const STALLS_PAGE = 'stalls.html';

const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const nearMeBtn = document.getElementById('nearMeBtn');
const statusMessage = document.getElementById('statusMessage');
const resultsList = document.getElementById('resultsList');

function renderResults(centres, distanceKey) {
  resultsList.innerHTML = '';
  centres.forEach((centre) => {
    const li = document.createElement('li');
    const distanceHtml = distanceKey && centre[distanceKey] !== undefined
      ? `<div class="distance">${centre[distanceKey].toFixed(2)} km away</div>`
      : '';
    li.innerHTML = `
      <a href="${STALLS_PAGE}">
        <h3>${centre.HCName}</h3>
        <div class="address">${centre.HCAddress}</div>
        ${distanceHtml}
      </a>
    `;
    resultsList.appendChild(li);
  });
}

async function handleSearch() {
  const query = searchInput.value.trim();
  if (!query) {
    statusMessage.textContent = 'Type an area name to search, e.g. "Clement".';
    return;
  }

  statusMessage.textContent = 'Searching...';
  resultsList.innerHTML = '';

  try {
    const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();

    if (!res.ok) {
      statusMessage.textContent = data.message || 'Search failed.';
      return;
    }

    statusMessage.textContent = data.message || `Found ${data.results.length} hawker centre(s).`;
    renderResults(data.results);
  } catch (err) {
    console.error('Search error:', err);
    statusMessage.textContent = 'Unable to reach the server. Please try again later.';
  }
}

function handleNearMe() {
  if (!navigator.geolocation) {
    statusMessage.textContent = 'Geolocation is not supported by your browser.';
    return;
  }

  statusMessage.textContent = 'Getting your location...';
  resultsList.innerHTML = '';

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      try {
        const res = await fetch(`${API_BASE}/nearby?lat=${latitude}&lng=${longitude}&radiusKm=5`);
        const data = await res.json();

        if (!res.ok) {
          statusMessage.textContent = data.message || 'Unable to find nearby hawker centres.';
          return;
        }

        statusMessage.textContent = data.message || `Found ${data.results.length} hawker centre(s) nearby.`;
        renderResults(data.results, 'DistanceKm');
      } catch (err) {
        console.error('Nearby fetch error:', err);
        statusMessage.textContent = 'Unable to reach the server. Please try again later.';
      }
    },
    (error) => {
      console.error('Geolocation error:', error);
      statusMessage.textContent = 'Could not get your location. Please allow location access and try again.';
    }
  );
}

searchBtn.addEventListener('click', handleSearch);
nearMeBtn.addEventListener('click', handleNearMe);
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleSearch();
});
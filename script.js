// 제공해주신 정보
const API_KEY = 'd1058f1b9bb34bdc51676d8c1417ceaff39ed16c20465346cee76d870adf9120';
const NX = 98;
const NY = 77;

/**
 * 현재 시간을 기준으로 기상청 실황(매시 40분 업데이트)에 맞는
 * base_date와 base_time을 계산하여 반환하는 함수
 */
function getKmaDateTime() {
    const now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth() + 1;
    let day = now.getDate();
    let hours = now.getHours();
    let minutes = now.getMinutes();

    // 40분 이전이면 이전 시간 데이터를 가져와야 함
    if (minutes < 40) {
        hours -= 1;
        if (hours < 0) {
            const yesterday = new Date(now.setDate(now.getDate() - 1));
            year = yesterday.getFullYear();
            month = yesterday.getMonth() + 1;
            day = yesterday.getDate();
            hours = 23;
        }
    }

    const baseDate = `${year}${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}`;
    const baseTime = `${String(hours).padStart(2, '0')}00`;
    const displayTime = `${month}월 ${day}일 ${hours}시 기준 데이터`;

    return { baseDate, baseTime, displayTime };
}

/**
 * 기상청 API를 호출하고 화면에 데이터를 표시하는 함수
 */
async function fetchWeather() {
    const refreshBtn = document.getElementById('refresh-btn');
    const errorEl = document.getElementById('error-message');
    
    // 로딩 상태 표시 및 에러 창 숨기기
    refreshBtn.innerText = "⏳ 불러오는 중...";
    refreshBtn.disabled = true;
    errorEl.classList.add('hidden');

    const { baseDate, baseTime, displayTime } = getKmaDateTime();
    document.getElementById('time-display').innerText = displayTime;

    const url = `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst?serviceKey=${API_KEY}&pageNo=1&numOfRows=10&dataType=JSON&base_date=${baseDate}&base_time=${baseTime}&nx=${NX}&ny=${NY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.response.header.resultCode !== '00') {
            throw new Error(data.response.header.resultMsg);
        }

        const items = data.response.body.items.item;
        const weatherData = {};
        
        items.forEach(item => {
            weatherData[item.category] = item.obsrValue;
        });

        updateUI(weatherData);

    } catch (error) {
        console.error("날씨 조회 실패:", error);
        errorEl.innerText = "데이터를 불러올 수 없습니다. 잠시 후 새로고침을 다시 눌러주세요.";
        errorEl.classList.remove('hidden');
    } finally {
        // 성공하든 실패하든 버튼 상태 복구
        refreshBtn.innerText = "🔄 실시간 새로고침";
        refreshBtn.disabled = false;
    }
}

/**
 * 받아온 데이터를 HTML 요소에 적용하는 함수
 */
function updateUI(data) {
    document.getElementById('temp').innerText = data.T1H;
    document.getElementById('humidity').innerText = `${data.REH}%`;
    document.getElementById('wind').innerText = `${data.WSD} m/s`;
    
    const rainValue = parseFloat(data.RN1) === 0 ? '-' : `${data.RN1} mm`;
    document.getElementById('rain').innerText = rainValue;

    const ptyCode = data.PTY;
    let statusText = "☀️ 맑음 / 구름"; 
    
    if (ptyCode === '1') statusText = "🌧️ 비";
    else if (ptyCode === '2') statusText = "🌨️ 비와 눈";
    else if (ptyCode === '3') statusText = "❄️ 눈";
    else if (ptyCode === '5') statusText = "💧 빗방울";
    else if (ptyCode === '6') statusText = "🌨️ 빗방울 눈날림";
    else if (ptyCode === '7') statusText = "❄️ 눈날림";
    
    document.getElementById('status').innerText = statusText;
}

// 1. 페이지가 처음 로드될 때 날씨 가져오기
fetchWeather();

// 2. 새로고침 버튼 클릭 시 날씨 다시 가져오기 이벤트 연결
document.getElementById('refresh-btn').addEventListener('click', fetchWeather);

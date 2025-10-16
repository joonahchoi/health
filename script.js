// script.js
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('routineForm');
  const resultDiv = document.getElementById('result');
  const resetBtn = document.getElementById('resetBtn');
  const ctx = document.getElementById('routineChart').getContext('2d');

  // 초기 차트(빈 상태)
  let chart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['데이터 없음'],
      datasets: [{
        data: [1],
        backgroundColor: ['#ffd6e8']
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.raw || 0;
              return `${label}: ${value}시간`;
            }
          }
        }
      }
    }
  });

  // 시간 문자열 "HH:MM"을 소수 시간(예: 7.5)으로 변환
  function timeStrToDecimal(t) {
    if (!t) return 0;
    const [hh, mm] = t.split(':').map(Number);
    return hh + mm/60;
  }

  // 두 시간 사이(취침에서 기상) 시간을 계산(다음날 기상 포함)
  function sleepDuration(startStr, endStr) {
    const start = timeStrToDecimal(startStr);
    const end = timeStrToDecimal(endStr);
    let duration = end - start;
    if (duration <= 0) duration += 24;
    return Math.round(duration * 100) / 100; // 소수점 둘째 자리 반올림
  }

  function formatHour(h) {
    return Math.round(h*100)/100;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // 입력값들
    const sleepStart = document.getElementById('sleepStart').value;
    const sleepEnd = document.getElementById('sleepEnd').value;
    const breakfast = document.getElementById('breakfastTime').value;
    const lunch = document.getElementById('lunchTime').value;
    const dinner = document.getElementById('dinnerTime').value;
    const exercise = parseFloat(document.getElementById('exerciseTime').value);
    const otherInput = document.getElementById('otherHours').value;

    // 수면 시간 계산
    const sleepHours = sleepDuration(sleepStart, sleepEnd);

    // 식사 시간은 고정으로 1시간씩(아침/점심/저녁) 가정. 필요 시 조정 가능.
    // 여기서는 사용자가 입력한 식사 시각이 있는지 확인 후 1시간씩 할당.
    const breakfastAssigned = breakfast ? 1 : 0;
    const lunchAssigned = lunch ? 1 : 0;
    const dinnerAssigned = dinner ? 1 : 0;
    const mealHours = breakfastAssigned + lunchAssigned + dinnerAssigned;

    // 기타 시간 처리:
    // 만약 사용자가 기타 시간을 입력하면 그 값을 사용.
    // 비어있으면 24 - (sleep + meal + exercise)로 자동 계산(단 0 이상)
    let otherHours = 0;
    if (otherInput !== '') {
      otherHours = Math.max(0, parseFloat(otherInput));
    } else {
      otherHours = 24 - (sleepHours + mealHours + (isNaN(exercise) ? 0 : exercise));
      if (otherHours < 0) otherHours = 0;
      otherHours = Math.round(otherHours * 100) / 100;
    }

    // 총합 체크 및 조정(합이 24보다 크면 비율로 정리)
    const rawParts = {
      '수면 💤': sleepHours,
      '식사 🍽️': mealHours,
      '운동 🏃‍♀️': isNaN(exercise) ? 0 : exercise,
      '기타 활동 ✨': otherHours
    };
    let total = Object.values(rawParts).reduce((a,b)=>a+b,0);
    // 만약 total이 거의 0이면 기본 표시
    if (total <= 0) {
      resultDiv.innerText = '유효한 시간이 입력되지 않았습니다. 시간을 확인해주세요.';
      return;
    }

    // 만약 총합이 24을 초과하면 비율로 축소하여 합이 24가 되도록 함
    if (total > 24) {
      const scale = 24 / total;
      for (let key in rawParts) rawParts[key] = Math.round(rawParts[key] * scale * 100) / 100;
      total = 24;
    }

    // 차트용 데이터 준비
    const labels = [];
    const data = [];
    const colors = ['#ff9fcf', '#ffd6e8', '#ff79b0', '#ffd3ea']; // 분홍 계열
    let i = 0;
    for (const [k,v] of Object.entries(rawParts)) {
      if (v > 0) {
        labels.push(k);
        data.push(formatHour(v));
        i++;
      }
    }

    // 기존 차트 업데이트
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.data.datasets[0].backgroundColor = colors.slice(0, labels.length);
    chart.update();

    // 결과 문구
    resultDiv.innerHTML = `
      <strong>요약</strong><br>
      수면: ${sleepHours}시간 🌙<br>
      식사(총): ${mealHours}시간 🍽️<br>
      운동: ${isNaN(exercise) ? 0 : exercise}시간 🏃‍♀️<br>
      기타: ${otherHours}시간 ✨<br>
      총합: ${Math.round((sleepHours + mealHours + (isNaN(exercise) ? 0 : exercise) + otherHours)*100)/100}시간
    `;
  });

  resetBtn.addEventListener('click', () => {
    form.reset();
    // 차트 초기화
    chart.data.labels = ['데이터 없음'];
    chart.data.datasets[0].data = [1];
    chart.data.datasets[0].backgroundColor = ['#ffd6e8'];
    chart.update();
    resultDiv.innerHTML = '';
  });
});

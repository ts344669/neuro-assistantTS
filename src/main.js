const MODES = {
  plan: {
    hint: 'Пример: Составьте план рабочего дня методолога: утром подготовка занятия, днём встреча с командой, вечером разбор домашних работ.',
  },
  checklist: {
    hint: 'Пример: Сделайте чек-лист запуска нового учебного модуля: от целей до проверки материалов.',
  },
  template: {
    hint: 'Пример: Напишите шаблон письма преподавателю о переносе дедлайна и просьбе о консультации.',
  },
  ideas: {
    hint: 'Пример: Предложите идеи коротких практических заданий по тайм-менеджменту для взрослых слушателей.',
  },
  free: {
    hint: 'Пример: Помогите коротко сформулировать цель занятия и критерии успешного результата.',
  },
};

const form = document.querySelector('#assist-form');
const queryInput = document.querySelector('#query');
const hintEl = document.querySelector('#hint');
const submitBtn = document.querySelector('#submit-btn');
const clearBtn = document.querySelector('#clear-btn');
const copyBtn = document.querySelector('#copy-btn');
const statusEl = document.querySelector('#status');
const errorEl = document.querySelector('#error');
const resultEl = document.querySelector('#result');

const EMPTY_RESULT = 'Здесь появится готовый ответ.';

function getSelectedMode() {
  const checked = form.querySelector('input[name="mode"]:checked');
  return checked ? checked.value : 'plan';
}

function updateHint() {
  const mode = getSelectedMode();
  hintEl.textContent = MODES[mode].hint;
}

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  statusEl.hidden = !isLoading;
}

function showError(message) {
  errorEl.hidden = !message;
  errorEl.textContent = message || '';
}

function setResult(text) {
  resultEl.textContent = text || EMPTY_RESULT;
}

form.addEventListener('change', (event) => {
  if (event.target.name === 'mode') {
    updateHint();
  }
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  showError('');

  const query = queryInput.value.trim();
  if (!query) {
    showError('Введите текст запроса.');
    queryInput.focus();
    return;
  }

  setLoading(true);

  try {
    const response = await fetch('/api/assist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: getSelectedMode(),
        query,
      }),
    });

    let data = {};
    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      throw new Error(data.error || 'Не получилось получить ответ. Попробуйте ещё раз.');
    }

    if (!data.result) {
      throw new Error('Ответ пришёл пустым. Попробуйте сформулировать запрос иначе.');
    }

    setResult(data.result);
  } catch (error) {
    const message =
      error instanceof TypeError
        ? 'Нет связи с сервером. Проверьте, что приложение запущено, и попробуйте снова.'
        : error.message;
    showError(message);
  } finally {
    setLoading(false);
  }
});

clearBtn.addEventListener('click', () => {
  form.reset();
  updateHint();
  showError('');
  setLoading(false);
  setResult(EMPTY_RESULT);
  queryInput.focus();
});

copyBtn.addEventListener('click', async () => {
  const text = resultEl.textContent.trim();
  if (!text || text === EMPTY_RESULT) {
    showError('Сначала получите результат, затем скопируйте его.');
    return;
  }

  try {
    await navigator.clipboard.writeText(resultEl.textContent);
    showError('');
    copyBtn.textContent = 'Скопировано';
    window.setTimeout(() => {
      copyBtn.textContent = 'Скопировать результат';
    }, 1600);
  } catch {
    showError('Не удалось скопировать текст. Выделите результат вручную.');
  }
});

updateHint();

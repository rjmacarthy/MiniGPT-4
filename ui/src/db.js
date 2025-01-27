// local storerage db

export const db = {
  get: key => {
    return JSON.parse(localStorage.getItem(key));
  },
  set: (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
  },
};

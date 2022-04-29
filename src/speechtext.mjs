export default function speechText(lang, use12Hours, now = new Date()) {
  const
    hours = now.getHours(),
    mins = now.getMinutes();

  if (/^en/.test(lang)) { // English
    const
      isMidnight = (hours === 0 && mins === 0),
      isNoon = (hours === 12 && mins === 0);
    const ampm = hours => (hours / 12 | 0) === 0 ? 'a.m.' : 'p.m.';
    const hoursName = hours =>
      (hours === 0 || hours === 24) ? 'midnight' :
      (hours === 12) ? 'noon' :
      use12Hours ? `${hours % 12} ${ampm(hours)}` :
      hours;

    if (isMidnight || isNoon) return hoursName(hours);
    else if (mins === 0) return use12Hours ?
      hoursName(hours) :
      `${hours} o'clock`;
    else if (mins === 15) return `quarter past ${hoursName(hours)}`;
    else if (mins === 30) return `half past ${hoursName(hours)}`;
    else if (mins === 45) return `quarter to ${hoursName(hours + 1)}`;
    else return `${padding(use12Hours ? hours % 12 : hours, 2)}:` +
      `${padding(mins, 2)} ${use12Hours ? ampm(hours) : ''}`.trim();

  } else if (/^ja/.test(lang)) { // Japanese
    const ampm = (hours / 12 | 0) === 0 ? '午前' : '午後';
    const hoursName =
      use12Hours ? `${ampm}${hours % 12}時` : `${hours}時`

    if (hours === 12 && mins === 0) return '正午';
    else if (mins === 0) return hoursName;
    else if (mins === 30) return `${hoursName}半`;
    else return `${hoursName}${mins}分`;

  } else {
    return `${padding(hours, 2)}:${padding(mins, 2)}`;
  }
}

function padding(n, l) {
  return ('0' + n).slice(-l);
}

const MIN_TOTAL_HEIGHT = 0
const MAX_TOTAL_HEIGHT = 10
const MIN_SUBBAR_HEIGHT = 1
const COLORS = [
  '#5f27cd',
  '#9b59b6',
  '#33d9b2',
  '#F9A825',
  '#EF6C00',
  '#27ae60',
  '#f368e0',
  '#00CC00',
  '#283593',
  '#e74c3c',
  '#FC427B',
]

const getGaussianRandomNumber = () => new Array(6)
  .fill(0)
  .map(() => Math.random())
  .reduce((acc, n) => acc + n, 0) / 6

const getMockBarItems = () => {
  const randNumber = getGaussianRandomNumber()
  const height = MIN_TOTAL_HEIGHT + randNumber * (MAX_TOTAL_HEIGHT - MIN_TOTAL_HEIGHT)

  const getSubbars = (heightLeft, freeColors, result) => {
    if (heightLeft === 0) return result
    if (freeColors.lenght < 2) {
      const subbar = {
        value: heightLeft,
        color: freeColors[0]
      }
      return [ ...result, subbar ]
    }

    const getSubbaHeight = () => {
      const randomHeight = Math.random() * heightLeft
      const height = randomHeight < MIN_SUBBAR_HEIGHT ? randomHeight + MIN_SUBBAR_HEIGHT : randomHeight
      const totalHeightAfter = heightLeft - height

      if (totalHeightAfter < MIN_SUBBAR_HEIGHT) return heightLeft

      return height
    }
    const value = getSubbaHeight()
    const [ color, ...newFreeColors ] = freeColors
    const subbar = {
      value,
      color
    }

    return getSubbars(heightLeft - value, newFreeColors, [ ...result, subbar ])
  }

  return getSubbars(height, COLORS, [])
}

export const getMockBars = (number, withLabels = true) => {
  const bars = new Array(number)
    .fill(0)
    .map((_, index) => {
      const items = getMockBarItems()
      if (!withLabels) return { items }

      const getLabel = () => {
        if (index + 1 === number) return 'Today'
        const today = new Date()
        today.setDate(today.getDate() - (number - index - 1))
        return `${today.getMonth() + 1}/${today.getDate()}`
      }

      return {
        items,
        label: getLabel()
      }
    })

  return bars
}
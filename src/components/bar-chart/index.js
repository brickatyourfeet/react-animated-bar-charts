import React from 'react'
import styled, { ThemeProvider } from 'styled-components'
import { DEFAULT_THEME } from '../../constants';

import DataContainer from './data-container'
import Scroller from './scroller'
import Bar from './bar'
import Label from './label'
import { sum } from '../../utils'

const RootContainer = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
`

const BarsView = styled.svg`
  height: 100%;
  width: 100%;
`

const LabelsContainer = styled.div`
  height: 40px;
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  display: flex;
  user-select: none;
`

const Line = styled.div`
  width: 100%;
  height: 1px;
  background-color: ${props => props.theme.mainColor};
`

export default class BarChart extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      height: 0,
      width: 0,
      offset: 0,
      oldOffset: 0,
      scrolling: false
    }
  }
  render() {
    const { theme, showScroller, barWidth, barSpace, bars, centerBarIndex, onBarSelect } = this.props
    const { width, offset, oldOffset, height, scrolling, totalWidth } = this.state

    const barTotalWidth = barWidth + barSpace

    const getStartIndex = () => {
      const startIndex = Math.floor((totalWidth - width - oldOffset - (offset > oldOffset ? offset - oldOffset : 0)) / barTotalWidth)
      if (startIndex < 0) return 0

      return startIndex
    }
    
    const startIndex = getStartIndex()
    const Content = () => {
      if (!width) return null
      const dataContainerProps = { barTotalWidth, width, offset, oldOffset, totalWidth, startIndex }

      const Labels = () => {
        const labels = slicedBars.map(b => b.label)
        if (labels.every(l => !l)) return null

        return (
          <LabelsContainer>
            {labels.map((label, index) => (
              <Label
                width={barWidth}
                space={barSpace}
                selected={centerBarIndex === index + startIndex}
                key={index + startIndex}
              >
                {label}
              </Label>
            ))}
          </LabelsContainer>
        )
      }
      const lastIndex = Math.ceil((totalWidth + oldOffset + (offset < oldOffset ? oldOffset - offset : 0)) / barTotalWidth)
      const slicedBars = bars.slice(startIndex, lastIndex)
      const highest = bars.map(b => b.items).reduce((acc, bar) => {
        const height = sum(bar)
        return height > acc ? height : acc
      }, 0)
      
      const Bars = () => {
        if (!height) return null
        const barCommonProps = { startIndex, height, barWidth, barSpace, centerBarIndex, onBarSelect, highest}
        return slicedBars.map(({ items }, index) =>(
          <Bar
            {...barCommonProps}
            bar={items}
            index={index}
            key={index}
          />
        ))
      }
      const scrollerProps = {
        totalWidth,
        width,
        offset,
        oldOffset,
        scrolling,
        onDragStart: () => this.setState({ scrolling: true, oldOffset: this.state.offset }),
        onDrag: this.onScroll,
        onDragEnd: () => this.setState({ scrolling: false })
      }
      return (
        <React.Fragment>
          <DataContainer {...dataContainerProps}>
            <BarsView ref={el => this.barsContainer = el}>
              <Bars/>
            </BarsView>
            {bars.length > 0 && <Line/>}
            <Labels/>
          </DataContainer>
          {showScroller && <Scroller {...scrollerProps} />}
        </React.Fragment>
      )
    }

    return (
      <ThemeProvider theme={{ ...DEFAULT_THEME, ...theme }}>
        <RootContainer ref={el => this.rootContainer = el }>
          <Content/>
        </RootContainer>
      </ThemeProvider>
    )
  }

  componentDidUpdate() {
    const { height } = this.barsContainer.getBoundingClientRect()
    if (this.state.height !== height) {
      this.setState({ height })
    }
  }

  componentDidMount() {
    window.addEventListener('resize', this.onResize)
    const { width } = this.rootContainer.getBoundingClientRect()
    this.setState({ width })
  }

  onResize = () => {
    const { width } = this.rootContainer.getBoundingClientRect()
    const { height } = this.barsContainer.getBoundingClientRect()
    this.setState({ width, height })
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.onResize)
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const { width, offset, scrolling } = prevState
    if (!width) return null

    const { centerBarIndex, barWidth, barSpace, bars } = nextProps
    const bar = barWidth + barSpace
    const totalWidth = bars.length * bar + barSpace
    const getNewOffsets = () => {
      if (centerBarIndex !== undefined && !scrolling) {
        if (totalWidth < width) {
          return {
            oldOffset: 0,
            offset: 0
          }
        }
        const offsetToCenter = totalWidth - bar * centerBarIndex - (width + bar) / 2
        const getOffset = () => {
          if (offsetToCenter < 0) return 0
          if (offsetToCenter + width > totalWidth) return totalWidth - width
          return offsetToCenter
        }

        return {
          offset: getOffset(),
          oldOffset: offset
        }
      }
    }
    return {
      ...prevState,
      ...getNewOffsets(),
      totalWidth
    }
  }

  onScroll = (movementX) => {
    const { width, offset, totalWidth } = this.state
    const { barWidth, barSpace, bars, selectCenterBarOnScroll, centerBarIndex, onBarSelect } = this.props
    const additionalOffset = (totalWidth / width) * movementX
    const getOffset = () => {
      const newOffset = offset - additionalOffset
      if (newOffset < 0) return 0
      if (newOffset + width > totalWidth) return totalWidth - width
      return newOffset
    }
    const newOffset = getOffset(0)
    this.setState({ offset: newOffset, oldOffset: newOffset })
    if (selectCenterBarOnScroll) {
      const center = totalWidth - newOffset - width / 2
      const newCenterBarIndex = bars.findIndex((_, index) => (index * (barWidth + barSpace)) >= center) - 1
      if (centerBarIndex !== newCenterBarIndex) {
        onBarSelect(newCenterBarIndex)
      }
    }
  }
}
import { useState, useCallback } from 'react'
import './App.css'

function App() {
  const [stats, setStats] = useState({
    attackPower: 100000,      // 물리/마법 공격력
    statValue: 3000,          // 힘/지능
    critDamage: 100,          // 크리티컬 데미지 증가
    damageIncrease: 100,      // 데미지 증가
    additionalDamage: 50,     // 추가 데미지
    elementDamage: 30,        // 속성 강화
    skillDamage: 100,         // 스킬 공격력 (%)
  })

  const [result, setResult] = useState(null)

  const handleChange = useCallback((e) => {
    const { name, value } = e.target
    setStats(prev => ({
      ...prev,
      [name]: Number(value) || 0
    }))
  }, [])

  const calculateDamage = useCallback(() => {
    const {
      attackPower,
      statValue,
      critDamage,
      damageIncrease,
      additionalDamage,
      elementDamage,
      skillDamage
    } = stats

    // 기본 스탯 보정 (힘/지능 250당 1% 증가)
    const statBonus = 1 + (statValue / 250) * 0.01

    // 크리티컬 데미지 보정
    const critBonus = 1 + (critDamage / 100)

    // 데미지 증가 보정
    const damageBonus = 1 + (damageIncrease / 100)

    // 추가 데미지 보정
    const additionalBonus = 1 + (additionalDamage / 100)

    // 속성 강화 보정 (속강 25당 약 1% 증가)
    const elementBonus = 1 + (elementDamage / 25) * 0.01

    // 스킬 공격력 보정
    const skillBonus = skillDamage / 100

    // 최종 데미지 계산
    const baseDamage = attackPower * statBonus
    const finalDamage = baseDamage * critBonus * damageBonus * additionalBonus * elementBonus * skillBonus

    // 딜 지수 계산 (던담 스타일)
    const dealIndex = Math.floor(finalDamage / 10000)

    setResult({
      baseDamage: Math.floor(baseDamage),
      finalDamage: Math.floor(finalDamage),
      dealIndex,
      critBonus: ((critBonus - 1) * 100).toFixed(1),
      totalMultiplier: (critBonus * damageBonus * additionalBonus * elementBonus).toFixed(2)
    })
  }, [stats])

  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  return (
    <div className="calculator-container">
      <header className="header">
        <h1>🎮 DNF 데미지 계산기</h1>
        <p>던전앤파이터 캐릭터 데미지를 계산해보세요</p>
      </header>

      <main className="main-content">
        <section className="input-section">
          <h2>캐릭터 스탯 입력</h2>

          <div className="stat-group">
            <div className="stat-item">
              <label htmlFor="attackPower">물리/마법 공격력</label>
              <input
                type="number"
                id="attackPower"
                name="attackPower"
                value={stats.attackPower}
                onChange={handleChange}
              />
            </div>

            <div className="stat-item">
              <label htmlFor="statValue">힘/지능</label>
              <input
                type="number"
                id="statValue"
                name="statValue"
                value={stats.statValue}
                onChange={handleChange}
              />
            </div>

            <div className="stat-item">
              <label htmlFor="critDamage">크리티컬 데미지 (%)</label>
              <input
                type="number"
                id="critDamage"
                name="critDamage"
                value={stats.critDamage}
                onChange={handleChange}
              />
            </div>

            <div className="stat-item">
              <label htmlFor="damageIncrease">데미지 증가 (%)</label>
              <input
                type="number"
                id="damageIncrease"
                name="damageIncrease"
                value={stats.damageIncrease}
                onChange={handleChange}
              />
            </div>

            <div className="stat-item">
              <label htmlFor="additionalDamage">추가 데미지 (%)</label>
              <input
                type="number"
                id="additionalDamage"
                name="additionalDamage"
                value={stats.additionalDamage}
                onChange={handleChange}
              />
            </div>

            <div className="stat-item">
              <label htmlFor="elementDamage">속성 강화</label>
              <input
                type="number"
                id="elementDamage"
                name="elementDamage"
                value={stats.elementDamage}
                onChange={handleChange}
              />
            </div>

            <div className="stat-item">
              <label htmlFor="skillDamage">스킬 공격력 (%)</label>
              <input
                type="number"
                id="skillDamage"
                name="skillDamage"
                value={stats.skillDamage}
                onChange={handleChange}
              />
            </div>
          </div>

          <button className="calculate-btn" onClick={calculateDamage}>
            데미지 계산하기
          </button>
        </section>

        {result && (
          <section className="result-section">
            <h2>계산 결과</h2>

            <div className="result-card main-result">
              <span className="result-label">딜 지수</span>
              <span className="result-value highlight">{formatNumber(result.dealIndex)}</span>
            </div>

            <div className="result-grid">
              <div className="result-card">
                <span className="result-label">기본 데미지</span>
                <span className="result-value">{formatNumber(result.baseDamage)}</span>
              </div>

              <div className="result-card">
                <span className="result-label">최종 데미지</span>
                <span className="result-value">{formatNumber(result.finalDamage)}</span>
              </div>

              <div className="result-card">
                <span className="result-label">크리티컬 보정</span>
                <span className="result-value">+{result.critBonus}%</span>
              </div>

              <div className="result-card">
                <span className="result-label">총 배율</span>
                <span className="result-value">x{result.totalMultiplier}</span>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="footer">
        <p>참고: 실제 게임 내 수치와 다를 수 있습니다</p>
      </footer>
    </div>
  )
}

export default App

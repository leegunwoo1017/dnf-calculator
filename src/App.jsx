import { useState, useCallback, useEffect } from 'react'
import './App.css'

const SERVERS = [
  { id: 'all', name: '전체' },
  { id: 'cain', name: '카인' },
  { id: 'diregie', name: '디레지에' },
  { id: 'siroco', name: '시로코' },
  { id: 'prey', name: '프레이' },
  { id: 'casillas', name: '카시야스' },
  { id: 'hilder', name: '힐더' },
  { id: 'anton', name: '안톤' },
  { id: 'bakal', name: '바칼' },
]

function App() {
  const [activeTab, setActiveTab] = useState('calculator')
  const [apiKey, setApiKey] = useState('')
  const [showApiKeyInput, setShowApiKeyInput] = useState(false)

  // Calculator state
  const [stats, setStats] = useState({
    attackPower: 100000,
    statValue: 3000,
    critDamage: 100,
    damageIncrease: 100,
    additionalDamage: 50,
    elementDamage: 30,
    skillDamage: 100,
  })
  const [calcResult, setCalcResult] = useState(null)

  // Search state
  const [searchType, setSearchType] = useState('character')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedServer, setSelectedServer] = useState('all')
  const [searchResults, setSearchResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Load API key from localStorage
  useEffect(() => {
    const savedApiKey = localStorage.getItem('dnf_api_key')
    if (savedApiKey) {
      setApiKey(savedApiKey)
    }
  }, [])

  // Save API key to localStorage
  const saveApiKey = () => {
    localStorage.setItem('dnf_api_key', apiKey)
    setShowApiKeyInput(false)
  }

  // Calculator handlers
  const handleStatChange = useCallback((e) => {
    const { name, value } = e.target
    setStats(prev => ({
      ...prev,
      [name]: Number(value) || 0
    }))
  }, [])

  const calculateDamage = useCallback(() => {
    const {
      attackPower, statValue, critDamage,
      damageIncrease, additionalDamage, elementDamage, skillDamage
    } = stats

    const statBonus = 1 + (statValue / 250) * 0.01
    const critBonus = 1 + (critDamage / 100)
    const damageBonus = 1 + (damageIncrease / 100)
    const additionalBonus = 1 + (additionalDamage / 100)
    const elementBonus = 1 + (elementDamage / 25) * 0.01
    const skillBonus = skillDamage / 100

    const baseDamage = attackPower * statBonus
    const finalDamage = baseDamage * critBonus * damageBonus * additionalBonus * elementBonus * skillBonus
    const dealIndex = Math.floor(finalDamage / 10000)

    setCalcResult({
      baseDamage: Math.floor(baseDamage),
      finalDamage: Math.floor(finalDamage),
      dealIndex,
      critBonus: ((critBonus - 1) * 100).toFixed(1),
      totalMultiplier: (critBonus * damageBonus * additionalBonus * elementBonus).toFixed(2)
    })
  }, [stats])

  // Search handlers
  const searchCharacter = async () => {
    if (!apiKey) {
      setError('API 키를 먼저 설정해주세요.')
      setShowApiKeyInput(true)
      return
    }
    if (!searchQuery.trim()) {
      setError('검색어를 입력해주세요.')
      return
    }

    setLoading(true)
    setError(null)
    setSearchResults(null)

    try {
      const encodedName = encodeURIComponent(searchQuery)
      const serverParam = selectedServer === 'all' ? '' : `&serverId=${selectedServer}`
      const url = `https://api.neople.co.kr/df/servers/${selectedServer === 'all' ? 'all' : selectedServer}/characters?characterName=${encodedName}&limit=20&wordType=match&apikey=${apiKey}`

      const response = await fetch(url)
      const data = await response.json()

      if (data.error) {
        throw new Error(data.error.message || 'API 오류가 발생했습니다.')
      }

      setSearchResults({
        type: 'character',
        data: data.rows || []
      })
    } catch (err) {
      setError(err.message || '검색 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const searchAdventurer = async () => {
    if (!apiKey) {
      setError('API 키를 먼저 설정해주세요.')
      setShowApiKeyInput(true)
      return
    }
    if (!searchQuery.trim()) {
      setError('검색어를 입력해주세요.')
      return
    }

    setLoading(true)
    setError(null)
    setSearchResults(null)

    try {
      const encodedName = encodeURIComponent(searchQuery)
      const serverParam = selectedServer === 'all' ? 'all' : selectedServer
      const url = `https://api.neople.co.kr/df/servers/${serverParam}/characters?characterName=${encodedName}&limit=50&wordType=match&apikey=${apiKey}`

      const response = await fetch(url)
      const data = await response.json()

      if (data.error) {
        throw new Error(data.error.message || 'API 오류가 발생했습니다.')
      }

      // Group by adventure name
      const adventureMap = new Map()
      ;(data.rows || []).forEach(char => {
        if (char.adventureName) {
          if (!adventureMap.has(char.adventureName)) {
            adventureMap.set(char.adventureName, {
              adventureName: char.adventureName,
              serverId: char.serverId,
              serverName: SERVERS.find(s => s.id === char.serverId)?.name || char.serverId,
              characters: []
            })
          }
          adventureMap.get(char.adventureName).characters.push(char)
        }
      })

      setSearchResults({
        type: 'adventurer',
        data: Array.from(adventureMap.values())
      })
    } catch (err) {
      setError(err.message || '검색 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    if (searchType === 'character') {
      searchCharacter()
    } else {
      searchAdventurer()
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  const getServerName = (serverId) => {
    return SERVERS.find(s => s.id === serverId)?.name || serverId
  }

  return (
    <div className="calculator-container">
      <header className="header">
        <h1>DNF Tools</h1>
        <p>던전앤파이터 데미지 계산기 & 캐릭터 검색</p>
      </header>

      {/* Tab Navigation */}
      <nav className="tab-nav">
        <button
          className={`tab-btn ${activeTab === 'calculator' ? 'active' : ''}`}
          onClick={() => setActiveTab('calculator')}
        >
          데미지 계산기
        </button>
        <button
          className={`tab-btn ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          캐릭터/모험단 검색
        </button>
        <button
          className="tab-btn settings-btn"
          onClick={() => setShowApiKeyInput(!showApiKeyInput)}
          title="API 키 설정"
        >
          설정
        </button>
      </nav>

      {/* API Key Input */}
      {showApiKeyInput && (
        <section className="api-key-section">
          <h3>네오플 API 키 설정</h3>
          <p className="api-key-info">
            <a href="https://developers.neople.co.kr" target="_blank" rel="noopener noreferrer">
              Neople Developers
            </a>에서 API 키를 발급받으세요.
          </p>
          <div className="api-key-input-group">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="API 키 입력"
              className="api-key-input"
            />
            <button onClick={saveApiKey} className="save-btn">저장</button>
          </div>
        </section>
      )}

      <main className="main-content">
        {/* Calculator Tab */}
        {activeTab === 'calculator' && (
          <>
            <section className="input-section">
              <h2>캐릭터 스탯 입력</h2>
              <div className="stat-group">
                <div className="stat-item">
                  <label htmlFor="attackPower">물리/마법 공격력</label>
                  <input type="number" id="attackPower" name="attackPower" value={stats.attackPower} onChange={handleStatChange} />
                </div>
                <div className="stat-item">
                  <label htmlFor="statValue">힘/지능</label>
                  <input type="number" id="statValue" name="statValue" value={stats.statValue} onChange={handleStatChange} />
                </div>
                <div className="stat-item">
                  <label htmlFor="critDamage">크리티컬 데미지 (%)</label>
                  <input type="number" id="critDamage" name="critDamage" value={stats.critDamage} onChange={handleStatChange} />
                </div>
                <div className="stat-item">
                  <label htmlFor="damageIncrease">데미지 증가 (%)</label>
                  <input type="number" id="damageIncrease" name="damageIncrease" value={stats.damageIncrease} onChange={handleStatChange} />
                </div>
                <div className="stat-item">
                  <label htmlFor="additionalDamage">추가 데미지 (%)</label>
                  <input type="number" id="additionalDamage" name="additionalDamage" value={stats.additionalDamage} onChange={handleStatChange} />
                </div>
                <div className="stat-item">
                  <label htmlFor="elementDamage">속성 강화</label>
                  <input type="number" id="elementDamage" name="elementDamage" value={stats.elementDamage} onChange={handleStatChange} />
                </div>
                <div className="stat-item">
                  <label htmlFor="skillDamage">스킬 공격력 (%)</label>
                  <input type="number" id="skillDamage" name="skillDamage" value={stats.skillDamage} onChange={handleStatChange} />
                </div>
              </div>
              <button className="calculate-btn" onClick={calculateDamage}>데미지 계산하기</button>
            </section>

            {calcResult && (
              <section className="result-section">
                <h2>계산 결과</h2>
                <div className="result-card main-result">
                  <span className="result-label">딜 지수</span>
                  <span className="result-value highlight">{formatNumber(calcResult.dealIndex)}</span>
                </div>
                <div className="result-grid">
                  <div className="result-card">
                    <span className="result-label">기본 데미지</span>
                    <span className="result-value">{formatNumber(calcResult.baseDamage)}</span>
                  </div>
                  <div className="result-card">
                    <span className="result-label">최종 데미지</span>
                    <span className="result-value">{formatNumber(calcResult.finalDamage)}</span>
                  </div>
                  <div className="result-card">
                    <span className="result-label">크리티컬 보정</span>
                    <span className="result-value">+{calcResult.critBonus}%</span>
                  </div>
                  <div className="result-card">
                    <span className="result-label">총 배율</span>
                    <span className="result-value">x{calcResult.totalMultiplier}</span>
                  </div>
                </div>
              </section>
            )}
          </>
        )}

        {/* Search Tab */}
        {activeTab === 'search' && (
          <>
            <section className="search-section">
              <h2>검색</h2>

              {/* Search Type Toggle */}
              <div className="search-type-toggle">
                <button
                  className={`toggle-btn ${searchType === 'character' ? 'active' : ''}`}
                  onClick={() => setSearchType('character')}
                >
                  캐릭터 검색
                </button>
                <button
                  className={`toggle-btn ${searchType === 'adventurer' ? 'active' : ''}`}
                  onClick={() => setSearchType('adventurer')}
                >
                  모험단 검색
                </button>
              </div>

              {/* Server Select */}
              <div className="server-select">
                <label>서버</label>
                <select value={selectedServer} onChange={(e) => setSelectedServer(e.target.value)}>
                  {SERVERS.map(server => (
                    <option key={server.id} value={server.id}>{server.name}</option>
                  ))}
                </select>
              </div>

              {/* Search Input */}
              <div className="search-input-group">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={searchType === 'character' ? '캐릭터명 입력' : '모험단명 또는 캐릭터명 입력'}
                  className="search-input"
                />
                <button onClick={handleSearch} className="search-btn" disabled={loading}>
                  {loading ? '검색 중...' : '검색'}
                </button>
              </div>

              {error && <div className="error-message">{error}</div>}
            </section>

            {/* Search Results */}
            {searchResults && (
              <section className="results-section">
                <h2>검색 결과 ({searchResults.data.length}건)</h2>

                {searchResults.data.length === 0 ? (
                  <p className="no-results">검색 결과가 없습니다.</p>
                ) : searchResults.type === 'character' ? (
                  <div className="character-list">
                    {searchResults.data.map((char, idx) => (
                      <div key={`${char.serverId}-${char.characterId}-${idx}`} className="character-card">
                        <div className="character-info">
                          <span className="character-name">{char.characterName}</span>
                          <span className="character-job">{char.jobGrowName}</span>
                        </div>
                        <div className="character-meta">
                          <span className="server-badge">{getServerName(char.serverId)}</span>
                          <span className="level">Lv.{char.level}</span>
                        </div>
                        {char.adventureName && (
                          <div className="adventure-name">모험단: {char.adventureName}</div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="adventurer-list">
                    {searchResults.data.map((adv, idx) => (
                      <div key={`${adv.serverId}-${adv.adventureName}-${idx}`} className="adventurer-card">
                        <div className="adventurer-header">
                          <span className="adventurer-name">{adv.adventureName}</span>
                          <span className="server-badge">{adv.serverName}</span>
                        </div>
                        <div className="adventurer-characters">
                          {adv.characters.map((char, charIdx) => (
                            <div key={`${char.characterId}-${charIdx}`} className="mini-character">
                              <span className="mini-name">{char.characterName}</span>
                              <span className="mini-job">{char.jobGrowName}</span>
                              <span className="mini-level">Lv.{char.level}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </main>

      <footer className="footer">
        <p>Data provided by Neople OpenAPI</p>
      </footer>
    </div>
  )
}

export default App

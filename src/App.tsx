import { 
  Trophy, 
  Users, 
  Gamepad2, 
  BarChart3, 
  Award, 
  Coins, 
  Search, 
  ShoppingCart, 
  User,
  Globe,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Monitor,
  PlayCircle,
  ArrowRight,
  LogOut,
  X,
  MailCheck,
  Lock,
  Eye,
  EyeOff,
  Plus,
  LayoutDashboard,
  Shield,
  ChevronRight,
  Trash2,
  ThumbsUp,
  RefreshCw,
  Edit
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useEffect } from 'react';

const AdminPanel = ({ userEmail, onLogout }: { userEmail: string | null, onLogout: () => void }) => {
  console.log("AdminPanel rendering for:", userEmail);
  const [activeTab, setActiveTab] = useState<'championships' | 'users'>('championships');
  const [championships, setChampionships] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [newChampName, setNewChampName] = useState('');
  const [newChampDesc, setNewChampDesc] = useState('');
  const [selectedChamp, setSelectedChamp] = useState<any>(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  useEffect(() => {
    if (activeTab === 'championships') {
      fetchChampionships();
    } else if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    console.log("Fetching users...");
    try {
      const res = await fetch('/api/users');
      console.log("Fetch users status:", res.status);
      const data = await res.json();
      console.log("Fetch users data:", data);
      if (res.ok && Array.isArray(data)) {
        setUsers(data);
      } else {
        console.error("Failed to fetch users or data is not an array:", data);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  useEffect(() => {
    if (selectedChamp) {
      fetchTeams(selectedChamp.id);
    }
  }, [selectedChamp]);

  const fetchChampionships = async () => {
    console.log("Fetching championships...");
    try {
      const res = await fetch('/api/championships');
      console.log("Fetch championships status:", res.status);
      const data = await res.json();
      console.log("Fetch championships data:", data);
      if (res.ok && Array.isArray(data)) {
        setChampionships(data);
      } else {
        console.error("Expected array for championships, got:", data);
        setChampionships([]);
      }
    } catch (err) {
      console.error("Failed to fetch championships:", err);
      setChampionships([]);
    }
  };

  const fetchTeams = async (id: number) => {
    try {
      const res = await fetch(`/api/championships/${id}/teams`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setTeams(data);
      } else {
        console.error("Expected array for teams, got:", data);
        setTeams([]);
      }
    } catch (err) {
      console.error("Failed to fetch teams:", err);
      setTeams([]);
    }
  };

  const fetchPlayers = async (teamId: number) => {
    try {
      const res = await fetch(`/api/teams/${teamId}/players`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setPlayers(data);
      }
    } catch (err) {
      console.error("Failed to fetch players:", err);
    }
  };

  const handleCreateChamp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChampName) return;
    console.log("Creating championship with name:", newChampName);
    setLoading(true);
    try {
      const res = await fetch('/api/championships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newChampName, description: newChampDesc })
      });
      
      console.log("Create championship response status:", res.status);
      if (res.ok) {
        console.log("Championship created successfully");
        setNewChampName('');
        setNewChampDesc('');
        await fetchChampionships();
      } else {
        const errData = await res.json();
        console.error("Failed to create championship:", errData);
        alert(`Erro: ${errData.error || 'Falha ao criar campeonato'}`);
      }
    } catch (err) {
      console.error("Failed to create championship (exception):", err);
      alert("Erro de conexão ao criar campeonato");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/championships/${id}/toggle-active`, {
        method: 'PATCH'
      });
      if (res.ok) {
        const data = await res.json();
        fetchChampionships();
        if (selectedChamp?.id === id) {
          setSelectedChamp({ ...selectedChamp, active: data.active });
        }
      }
    } catch (err) {
      console.error("Failed to toggle active status:", err);
    }
  };

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName || !selectedChamp) return;
    setLoading(true);
    try {
      await fetch(`/api/championships/${selectedChamp.id}/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTeamName })
      });
      setNewTeamName('');
      fetchTeams(selectedChamp.id);
    } catch (err) {
      console.error("Failed to add team:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeam = async (teamId: number) => {
    if (!selectedChamp || !window.confirm("Deseja realmente excluir este time?")) return;
    try {
      const res = await fetch(`/api/championships/${selectedChamp.id}/teams/${teamId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchTeams(selectedChamp.id);
        if (selectedTeam?.id === teamId) setSelectedTeam(null);
      }
    } catch (err) {
      console.error("Failed to delete team:", err);
    }
  };

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName || !selectedTeam) return;
    setLoading(true);
    try {
      await fetch(`/api/teams/${selectedTeam.id}/players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPlayerName })
      });
      setNewPlayerName('');
      fetchPlayers(selectedTeam.id);
    } catch (err) {
      console.error("Failed to add player:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlayer = async (playerId: number) => {
    if (!selectedTeam || !window.confirm("Deseja realmente excluir este jogador?")) return;
    try {
      await fetch(`/api/players/${playerId}`, { method: 'DELETE' });
      fetchPlayers(selectedTeam.id);
    } catch (err) {
      console.error("Failed to delete player:", err);
    }
  };

  const handleDeleteChamp = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!window.confirm("Deseja realmente excluir este campeonato e todos os seus times?")) return;
    try {
      const res = await fetch(`/api/championships/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchChampionships();
        if (selectedChamp?.id === id) {
          setSelectedChamp(null);
        }
      }
    } catch (err) {
      console.error("Failed to delete championship:", err);
    }
  };

  const handleUpdateChamp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChamp || !editName) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/championships/${selectedChamp.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, description: editDesc })
      });
      if (res.ok) {
        const updated = await res.json();
        setIsEditing(false);
        fetchChampionships();
        setSelectedChamp(updated);
      }
    } catch (err) {
      console.error("Failed to update championship:", err);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = () => {
    if (!selectedChamp) return;
    setEditName(selectedChamp.name);
    setEditDesc(selectedChamp.description || '');
    setIsEditing(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-white/10">
          <div className="text-2xl font-black tracking-tighter italic">
            ProClubs League<span className="text-red-500">.</span> ADM
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('championships')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-all ${activeTab === 'championships' ? 'bg-red-500 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <Trophy size={18} /> Campeonatos
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-all ${activeTab === 'users' ? 'bg-red-500 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <Users size={18} /> Usuários
          </button>
        </nav>
        <div className="p-6 border-t border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center font-bold">
              {userEmail?.[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{userEmail}</p>
              <p className="text-[10px] text-gray-400 uppercase">Administrador</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold uppercase text-red-400 hover:text-red-300 transition-colors"
          >
            <LogOut size={14} /> Sair do ADM
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'championships' ? (
            <>
              <header className="mb-12 flex justify-between items-end">
                <div>
                  <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Gerenciamento de Ligas</h1>
                  <p className="text-gray-500 mt-1">Cadastre novos campeonatos e organize as equipes participantes.</p>
                </div>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Create & List Championships */}
                <div className="lg:col-span-1 space-y-8">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold uppercase mb-6 flex items-center gap-2">
                      <Plus size={20} className="text-red-500" /> Novo Campeonato
                    </h2>
                    <form onSubmit={handleCreateChamp} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Nome da Liga</label>
                        <input 
                          type="text" 
                          value={newChampName}
                          onChange={(e) => setNewChampName(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all text-sm"
                          placeholder="Ex: Série A 2026"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Descrição</label>
                        <textarea 
                          value={newChampDesc}
                          onChange={(e) => setNewChampDesc(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all text-sm h-24 resize-none"
                          placeholder="Detalhes do torneio..."
                        />
                      </div>
                      <button 
                        disabled={loading}
                        className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50"
                      >
                        Criar Campeonato
                      </button>
                    </form>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                      <h2 className="text-lg font-bold uppercase flex items-center gap-2">
                        <Trophy size={20} className="text-red-500" /> Seus Campeonatos
                      </h2>
                      <button 
                        onClick={fetchChampionships}
                        className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-red-500 transition-all"
                        title="Atualizar"
                      >
                        <RefreshCw size={16} />
                      </button>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {championships.map((champ) => (
                        <button 
                          key={champ.id}
                          onClick={() => setSelectedChamp(champ)}
                          className={`w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left ${selectedChamp?.id === champ.id ? 'bg-red-50 border-l-4 border-red-500' : ''}`}
                        >
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={(e) => handleToggleActive(e, champ.id)}
                              className={`p-2 rounded-full transition-all ${champ.active ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
                              title={champ.active ? "Ativo" : "Inativo"}
                            >
                              <ThumbsUp size={16} fill={champ.active ? "currentColor" : "none"} />
                            </button>
                            <div>
                              <p className="font-bold text-gray-900">{champ.name}</p>
                              <p className="text-[10px] text-gray-400 uppercase">{new Date(champ.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={(e) => handleDeleteChamp(e, champ.id)}
                              className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                              title="Excluir"
                            >
                              <Trash2 size={16} />
                            </button>
                            <ChevronRight size={18} className="text-gray-300" />
                          </div>
                        </button>
                      ))}
                      {championships.length === 0 && (
                        <div className="p-8 text-center text-gray-400 text-sm italic">Nenhum campeonato cadastrado.</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column: Teams Management */}
                <div className="lg:col-span-2">
                  {selectedChamp ? (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-8"
                    >
                      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start mb-8">
                          {isEditing ? (
                            <form onSubmit={handleUpdateChamp} className="w-full space-y-4">
                              <div>
                                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Nome da Liga</label>
                                <input 
                                  type="text" 
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Descrição</label>
                                <textarea 
                                  value={editDesc}
                                  onChange={(e) => setEditDesc(e.target.value)}
                                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all text-sm h-24 resize-none"
                                />
                              </div>
                              <div className="flex gap-2">
                                <button 
                                  type="submit"
                                  disabled={loading}
                                  className="bg-slate-900 text-white font-bold px-6 py-2 rounded-lg hover:bg-slate-800 transition-all text-sm disabled:opacity-50"
                                >
                                  Salvar Alterações
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => setIsEditing(false)}
                                  className="bg-gray-100 text-gray-600 font-bold px-6 py-2 rounded-lg hover:bg-gray-200 transition-all text-sm"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </form>
                          ) : (
                            <>
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="px-2 py-1 bg-red-100 text-red-600 text-[10px] font-bold uppercase rounded">ID: #{selectedChamp.id}</span>
                                  <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded ${selectedChamp.active ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                    {selectedChamp.active ? 'Ativo' : 'Inativo'}
                                  </span>
                                  <h2 className="text-2xl font-black text-gray-900 uppercase">{selectedChamp.name}</h2>
                                </div>
                                <p className="text-gray-500 text-sm">{selectedChamp.description || 'Sem descrição.'}</p>
                              </div>
                              <button 
                                onClick={startEditing}
                                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                title="Editar"
                              >
                                <Edit size={20} />
                              </button>
                            </>
                          )}
                        </div>

                        <div className="border-t border-gray-100 pt-8">
                          <h3 className="text-sm font-bold uppercase text-gray-400 mb-6 flex items-center gap-2">
                            <Shield size={16} /> Adicionar Time Participante
                          </h3>
                          <form onSubmit={handleAddTeam} className="flex gap-4">
                            <input 
                              type="text" 
                              value={newTeamName}
                              onChange={(e) => setNewTeamName(e.target.value)}
                              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all text-sm"
                              placeholder="Nome do Time (Ex: Flamengo eSports)"
                            />
                            <button 
                              disabled={loading}
                              className="bg-red-500 text-white font-bold px-8 rounded-xl hover:bg-red-600 transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                              <Plus size={18} /> Adicionar
                            </button>
                          </form>
                        </div>
                      </div>

                      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                          <h2 className="text-lg font-bold uppercase flex items-center gap-2">
                            <Users size={20} className="text-red-500" /> Times Inscritos ({teams.length})
                          </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
                          {teams.map((team) => (
                            <div key={team.id} className="space-y-2">
                              <div 
                                onClick={() => {
                                  setSelectedTeam(selectedTeam?.id === team.id ? null : team);
                                  if (selectedTeam?.id !== team.id) fetchPlayers(team.id);
                                }}
                                className={`p-4 rounded-xl border transition-all flex items-center justify-between group cursor-pointer ${selectedTeam?.id === team.id ? 'bg-red-50 border-red-200 shadow-sm' : 'bg-gray-50 border-gray-100 hover:border-gray-200'}`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-colors ${selectedTeam?.id === team.id ? 'bg-white text-red-500 border-red-100' : 'bg-white text-slate-400 border-gray-100'}`}>
                                    <Shield size={20} />
                                  </div>
                                  <span className="font-bold text-gray-800">{team.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteTeam(team.id);
                                    }}
                                    className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                  <ChevronRight size={16} className={`text-gray-300 transition-transform ${selectedTeam?.id === team.id ? 'rotate-90 text-red-500' : ''}`} />
                                </div>
                              </div>
                              
                              <AnimatePresence>
                                {selectedTeam?.id === team.id && (
                                  <motion.div 
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden bg-white border border-red-100 rounded-xl ml-4"
                                  >
                                    <div className="p-4 space-y-4">
                                      <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                                        <h4 className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">Jogadores</h4>
                                        <span className="text-[10px] font-bold text-red-500">{players.length}</span>
                                      </div>
                                      
                                      <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                        {players.map(player => (
                                          <div key={player.id} className="flex items-center justify-between text-sm py-1 group/player">
                                            <div className="flex items-center gap-2">
                                              <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                                              <span className="text-gray-700">{player.name}</span>
                                            </div>
                                            <button 
                                              onClick={() => handleDeletePlayer(player.id)}
                                              className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover/player:opacity-100"
                                            >
                                              <X size={12} />
                                            </button>
                                          </div>
                                        ))}
                                        {players.length === 0 && (
                                          <p className="text-[10px] text-gray-400 italic text-center py-2">Nenhum jogador cadastrado.</p>
                                        )}
                                      </div>

                                      <form onSubmit={handleAddPlayer} className="flex gap-2 pt-2">
                                        <input 
                                          type="text"
                                          value={newPlayerName}
                                          onChange={(e) => setNewPlayerName(e.target.value)}
                                          placeholder="Novo Jogador..."
                                          className="flex-1 text-xs px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg focus:ring-1 focus:ring-red-500 outline-none"
                                        />
                                        <button 
                                          disabled={loading}
                                          className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all disabled:opacity-50"
                                        >
                                          <Plus size={14} />
                                        </button>
                                      </form>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          ))}
                          {teams.length === 0 && (
                            <div className="col-span-full py-12 text-center">
                              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-200">
                                <Users size={32} />
                              </div>
                              <p className="text-gray-400 text-sm italic">Nenhum time inscrito neste campeonato ainda.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
                      <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-gray-300">
                        <Trophy size={40} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 uppercase mb-2">Selecione um Campeonato</h3>
                      <p className="text-gray-400 max-w-xs">Escolha uma liga na lista ao lado para gerenciar os times participantes.</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <header className="mb-12 flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Gerenciamento de Usuários</h1>
                  <p className="text-gray-500 mt-1">Visualize todos os usuários cadastrados na plataforma.</p>
                </div>
                <button 
                  onClick={fetchUsers}
                  className="p-3 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 transition-all text-gray-400 hover:text-red-500 shadow-sm"
                  title="Atualizar Lista"
                >
                  <RefreshCw size={20} />
                </button>
              </header>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="px-6 py-4 text-[10px] font-bold uppercase text-gray-400 tracking-widest">ID</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase text-gray-400 tracking-widest">E-mail</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase text-gray-400 tracking-widest">Status</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase text-gray-400 tracking-widest">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm font-mono text-gray-400">#{user.id}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                {user.email ? user.email[0].toUpperCase() : '?'}
                              </div>
                              <span className="text-sm font-bold text-gray-900">{user.email || 'Sem e-mail'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded ${user.verified ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                              {user.verified ? 'Verificado' : 'Pendente'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button className="text-xs font-bold uppercase text-red-500 hover:underline">Bloquear</button>
                          </td>
                        </tr>
                      ))}
                      {users.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-gray-400 text-sm italic">
                            Nenhum usuário encontrado.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const AuthModal = ({ isOpen, onClose, onAuthSuccess, initialMode = 'login' }: { isOpen: boolean, onClose: () => void, onAuthSuccess: (email: string) => void, initialMode?: 'login' | 'register' }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'verify' | 'forgot-password' | 'reset-password'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError('');
      
      const savedEmail = localStorage.getItem('vpsl_email');
      const savedPass = localStorage.getItem('vpsl_password');
      const savedRemember = localStorage.getItem('vpsl_remember') === 'true';
      
      if (savedRemember) {
        setEmail(savedEmail || '');
        setPassword(savedPass || '');
        setRememberMe(true);
      } else {
        setEmail('');
        setPassword('');
        setRememberMe(false);
      }
      setCode('');
    }
  }, [isOpen, initialMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (rememberMe) {
      localStorage.setItem('vpsl_email', email);
      localStorage.setItem('vpsl_password', password);
      localStorage.setItem('vpsl_remember', 'true');
    } else {
      localStorage.removeItem('vpsl_email');
      localStorage.removeItem('vpsl_password');
      localStorage.setItem('vpsl_remember', 'false');
    }

    try {
      if (mode === 'login') {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (res.ok) {
          onAuthSuccess(email);
          onClose();
        } else if (res.status === 403 && data.needsVerification) {
          setMode('verify');
        } else {
          setError(data.error);
        }
      } else if (mode === 'register') {
        const res = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (res.ok) {
          setMode('verify');
          setError(`DEMO: Use o código ${data.demoCode}`);
        } else {
          setError(data.error);
        }
      } else if (mode === 'verify') {
        const res = await fetch('/api/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, code })
        });
        const data = await res.json();
        if (res.ok) {
          onAuthSuccess(email);
          onClose();
        } else {
          setError(data.error);
        }
      } else if (mode === 'forgot-password') {
        const res = await fetch('/api/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (res.ok) {
          setMode('reset-password');
          setError(`DEMO: Use o código ${data.demoCode}`);
        } else {
          setError(data.error);
        }
      } else if (mode === 'reset-password') {
        const res = await fetch('/api/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, code, newPassword: password })
        });
        const data = await res.json();
        if (res.ok) {
          setMode('login');
          setError('Senha alterada com sucesso! Faça login agora.');
        } else {
          setError(data.error);
        }
      }
    } catch (err) {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={24} />
        </button>

        <div className="p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 text-red-500 mb-4">
              {mode === 'verify' ? <MailCheck size={32} /> : <User size={32} />}
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              {mode === 'login' && 'Bem-vindo de volta'}
              {mode === 'register' && 'Crie sua conta'}
              {mode === 'verify' && 'Verifique seu e-mail'}
              {mode === 'forgot-password' && 'Recuperar senha'}
              {mode === 'reset-password' && 'Nova senha'}
            </h2>
            <p className="text-gray-500 text-sm mt-2">
              {mode === 'login' && 'Entre com suas credenciais para continuar'}
              {mode === 'register' && 'Junte-se à maior liga de futebol virtual'}
              {mode === 'verify' && `Enviamos um código para ${email}`}
              {mode === 'forgot-password' && 'Digite seu e-mail para receber o código'}
              {mode === 'reset-password' && 'Digite o código e sua nova senha'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {(mode !== 'verify' && mode !== 'reset-password') && (
              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all text-sm"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>
            )}

            {(mode === 'login' || mode === 'register' || mode === 'reset-password') && (
              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">
                  {mode === 'reset-password' ? 'Nova Senha' : 'Senha'}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all text-sm"
                    placeholder="••••••••"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {mode === 'login' && (
                  <div className="flex items-center justify-between mt-1">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-red-500 focus:ring-red-500"
                      />
                      <span className="text-xs text-gray-500 group-hover:text-gray-700 transition-colors">Lembrar-me</span>
                    </label>
                    <button 
                      type="button"
                      onClick={() => setMode('forgot-password')}
                      className="text-xs text-red-500 hover:underline font-medium"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                )}
              </div>
            )}

            {(mode === 'verify' || mode === 'reset-password') && (
              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-1 text-center">Código de 6 dígitos</label>
                <input 
                  type="text" 
                  required
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full text-center text-3xl tracking-[0.5em] font-bold py-4 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                  placeholder="000000"
                />
              </div>
            )}

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50 text-red-500 text-xs rounded-lg text-center font-medium"
              >
                {error}
              </motion.div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  {mode === 'login' && 'Entrar'}
                  {mode === 'register' && 'Criar Conta'}
                  {mode === 'verify' && 'Verificar'}
                  {mode === 'forgot-password' && 'Enviar Código'}
                  {mode === 'reset-password' && 'Redefinir Senha'}
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            {mode === 'login' && (
              <p className="text-sm text-gray-500">
                Não tem uma conta? {' '}
                <button onClick={() => setMode('register')} className="text-red-500 font-bold hover:underline">Cadastre-se</button>
              </p>
            )}
            {mode === 'register' && (
              <p className="text-sm text-gray-500">
                Já tem uma conta? {' '}
                <button onClick={() => setMode('login')} className="text-red-500 font-bold hover:underline">Entre agora</button>
              </p>
            )}
            {mode === 'verify' && (
              <button 
                onClick={() => setMode('register')}
                className="text-sm text-gray-500 hover:text-gray-700 font-medium"
              >
                Voltar para o cadastro
              </button>
            )}
            {(mode === 'forgot-password' || mode === 'reset-password') && (
              <button 
                onClick={() => setMode('login')}
                className="text-sm text-gray-500 hover:text-gray-700 font-medium"
              >
                Voltar para o login
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const Navbar = ({ isLoggedIn, userEmail, onOpenAuth, onLogout }: { isLoggedIn: boolean, userEmail: string | null, onOpenAuth: () => void, onLogout: () => void }) => (
  <nav className="bg-[#1a1a1a] text-white py-4 px-6 sticky top-0 z-50 shadow-lg">
    <div className="max-w-7xl mx-auto flex items-center justify-between">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center overflow-hidden border border-gray-800">
            <img 
              src="/logo.png" 
              alt="ProClubs League" 
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-black font-black italic text-xl">PL</span>';
              }}
            />
          </div>
          <div className="text-2xl font-black tracking-tighter italic text-white uppercase">
            ProClubs<span className="text-red-500">League</span>
          </div>
        </div>
        <div className="hidden lg:flex items-center gap-6 text-xs font-bold uppercase tracking-wider">
          <a href="#" className="hover:text-red-500 transition-colors">Torneios Rápidos</a>
          <a href="#" className="hover:text-red-500 transition-colors">1X1</a>
          <a href="#" className="hover:text-red-500 transition-colors">Campeonatos</a>
          <a href="#" className="hover:text-red-500 transition-colors">Clubes</a>
          <a href="#" className="hover:text-red-500 transition-colors">Jogadores</a>
          <a href="#" className="hover:text-red-500 transition-colors">Tribunal</a>
          <a href="#" className="hover:text-red-500 transition-colors">Suporte</a>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button className="bg-purple-600 hover:bg-purple-700 px-4 py-1.5 rounded text-xs font-bold uppercase transition-colors">Loja</button>
        
        {isLoggedIn ? (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-emerald-400">
              <User size={14} />
              <span className="max-w-[100px] truncate">{userEmail}</span>
            </div>
            <button 
              onClick={onLogout}
              className="text-xs font-bold uppercase hover:text-red-500 transition-colors flex items-center gap-1"
            >
              <LogOut size={14} /> Sair
            </button>
          </div>
        ) : (
          <button 
            onClick={onOpenAuth}
            className="text-xs font-bold uppercase hover:text-red-500 transition-colors"
          >
            Entrar
          </button>
        )}

        <div className="flex items-center gap-3 ml-2">
          <Search size={18} className="cursor-pointer hover:text-red-500" />
          <div className="relative cursor-pointer hover:text-red-500">
            <ShoppingCart size={18} />
            <span className="absolute -top-2 -right-2 bg-red-500 text-[10px] w-4 h-4 rounded-full flex items-center justify-center">0</span>
          </div>
        </div>
      </div>
    </div>
  </nav>
);

// ... (Hero, Partners, FeatureCard, CareerStart, BuildCareer, Banner, InfoSection, StatBlock, Stats, CTA, Footer components remain the same)

const Hero = ({ onOpenAuth }: { onOpenAuth: (mode: 'login' | 'register') => void }) => (
  <section className="hero-gradient relative overflow-hidden py-24 px-6">
    <div className="dot-pattern absolute inset-0 opacity-30"></div>
    <div className="max-w-4xl mx-auto text-center relative z-10">
      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl md:text-6xl font-bold text-white mb-6"
      >
        Bem-vindo à ProClubsLeague.com
      </motion.h1>
      <motion.p 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-xl text-white/80 mb-10"
      >
        Você está preparado para construir sua carreira no futebol virtual?
      </motion.p>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row items-center justify-center gap-4"
      >
        <button 
          onClick={() => onOpenAuth('register')}
          className="bg-white text-indigo-900 px-8 py-3 rounded font-bold uppercase tracking-wider hover:bg-gray-100 transition-all w-full sm:w-auto"
        >
          Registrar
        </button>
        <button className="border-2 border-white text-white px-8 py-3 rounded font-bold uppercase tracking-wider hover:bg-white/10 transition-all w-full sm:w-auto">
          O que é o Pro Clubs?
        </button>
      </motion.div>
    </div>
  </section>
);

const Partners = () => (
  <section className="bg-white py-12 border-b border-gray-100">
    <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-center items-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all">
      <div className="text-2xl font-bold text-gray-400">REDETV</div>
      <div className="text-2xl font-bold text-gray-400 italic">Rádio Globo</div>
      <div className="text-2xl font-bold text-gray-400">FIFAMANIA</div>
      <div className="text-2xl font-bold text-gray-400 flex items-center gap-2">
        <Monitor size={24} /> DISCORD
      </div>
      <div className="text-2xl font-bold text-gray-400 flex items-center gap-2">
        <PlayCircle size={24} /> TWITCH
      </div>
    </div>
  </section>
);

const FeatureCard = ({ icon: Icon, title, description, color }: { icon: any, title: string, description: string, color: string }) => (
  <div className="flex flex-col items-center text-center p-6">
    <div className={`${color} w-16 h-16 rounded-full flex items-center justify-center text-white mb-4 shadow-lg`}>
      <Icon size={32} />
    </div>
    <h3 className="text-lg font-bold uppercase mb-2 text-gray-800">{title}</h3>
    <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
  </div>
);

const CareerStart = () => (
  <section className="py-20 bg-white">
    <div className="max-w-7xl mx-auto px-6">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold uppercase tracking-tight text-gray-900 mb-4">O começo da sua carreira no futebol virtual</h2>
        <p className="text-gray-500">Você tem o necessário para estar entre os melhores?</p>
        <div className="w-12 h-1 bg-red-500 mx-auto mt-6"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <FeatureCard 
          icon={Users}
          title="Encontre um clube"
          description="Primeiro, você precisará de um clube para participar dos nossos torneios. Encontre um, ou crie o seu!"
          color="bg-blue-500"
        />
        <FeatureCard 
          icon={Gamepad2}
          title="Entre em campo"
          description="Como jogador contratado em um clube, enfrente outras equipes em torneios oficiais da ProClubsLeague.com."
          color="bg-green-500"
        />
        <FeatureCard 
          icon={Trophy}
          title="Torne-se uma lenda"
          description="Quem não quer ser o melhor? Escale nossos rankings e se torne uma lenda do futebol!"
          color="bg-red-500"
        />
      </div>
    </div>
  </section>
);

const BuildCareer = () => (
  <section className="py-20 bg-gray-50">
    <div className="max-w-7xl mx-auto px-6">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold uppercase tracking-tight text-gray-900 mb-4">Venha construir sua carreira na ProClubsLeague.com</h2>
        <p className="text-gray-500">Conheça um pouco mais sobre nossa plataforma</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        <div className="flex gap-4">
          <div className="flex-shrink-0 bg-slate-700 w-12 h-12 rounded-full flex items-center justify-center text-white">
            <Users size={24} />
          </div>
          <div>
            <h4 className="font-bold uppercase text-sm mb-2">Jogue 11 vs 11 Online</h4>
            <p className="text-xs text-gray-500 leading-relaxed">Qualquer que seja seu gramado virtual, estaremos lá com você e seu clube. Oferecemos torneios gratuitos em todas as plataformas.</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="flex-shrink-0 bg-slate-700 w-12 h-12 rounded-full flex items-center justify-center text-white">
            <Monitor size={24} />
          </div>
          <div>
            <h4 className="font-bold uppercase text-sm mb-2">Simulador de Carreira Virtual</h4>
            <p className="text-xs text-gray-500 leading-relaxed">Assuma o controle total da sua carreira! Na ProClubsLeague.com, você tem um perfil customizável e um contrato virtual.</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="flex-shrink-0 bg-slate-700 w-12 h-12 rounded-full flex items-center justify-center text-white">
            <Trophy size={24} />
          </div>
          <div>
            <h4 className="font-bold uppercase text-sm mb-2">Campeonatos Nacionais e Internacionais</h4>
            <p className="text-xs text-gray-500 leading-relaxed">Aqui você pode competir em sua liga nacional, em competições internacionais de clubes, e até mesmo na Seleção do seu país!</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="flex-shrink-0 bg-slate-700 w-12 h-12 rounded-full flex items-center justify-center text-white">
            <BarChart3 size={24} />
          </div>
          <div>
            <h4 className="font-bold uppercase text-sm mb-2">Muitas Estatísticas</h4>
            <p className="text-xs text-gray-500 leading-relaxed">Individuais ou coletivas, suas estatísticas moram aqui. Gols marcados, assistências, jogos sem tomar gol, e muito mais!</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="flex-shrink-0 bg-slate-700 w-12 h-12 rounded-full flex items-center justify-center text-white">
            <Award size={24} />
          </div>
          <div>
            <h4 className="font-bold uppercase text-sm mb-2">Conquistas</h4>
            <p className="text-xs text-gray-500 leading-relaxed">Essa é parte do seu legado. Disputando partidas oficiais pela ProClubsLeague.com, sua performance desbloqueia conquistas.</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="flex-shrink-0 bg-slate-700 w-12 h-12 rounded-full flex items-center justify-center text-white">
            <Coins size={24} />
          </div>
          <div>
            <h4 className="font-bold uppercase text-sm mb-2">Pro Points</h4>
            <p className="text-xs text-gray-500 leading-relaxed">Sua nova moeda favorita! Clubes podem investir seus Pro Points no mercado de transferências, e jogadores podem gastar seus salários.</p>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const Banner = () => (
  <section className="relative h-[400px] flex items-center justify-center overflow-hidden">
    <img 
      src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=1920" 
      alt="Stadium" 
      className="absolute inset-0 w-full h-full object-cover brightness-50"
      referrerPolicy="no-referrer"
    />
    <div className="relative z-10 text-center text-white px-6">
      <h2 className="text-4xl md:text-5xl font-black uppercase mb-4 tracking-tighter">A paixão pelo futebol está aqui</h2>
      <p className="text-lg md:text-xl font-medium opacity-90">Jogue online com seus amigos em partidas 11 contra 11 emocionantes</p>
    </div>
  </section>
);

const InfoSection = () => (
  <section className="py-20 bg-white">
    <div className="max-w-7xl mx-auto px-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div>
          <h3 className="text-xl font-bold uppercase mb-6 border-b-2 border-red-500 pb-2 inline-block">O que é o Pro Clubs?</h3>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            Você provavelmente está acostumado a jogar games de simulação de futebol sozinho, controlando toda sua equipe, mas agindo apenas como o jogador com a bola no pé, certo? Mas não é assim que o futebol de verdade funciona!
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            Pro Clubs é o mais próximo que jogar videogame vai chegar da experiênca de se tornar um jogador de futebol de verdade: é uma modalidade multiplayer online, 11vs11, dentro do game FIFA da EA Sports, em que cada jogador controla um jogador criado e customizado por ele próprio.
          </p>
        </div>
        <div>
          <h3 className="text-xl font-bold uppercase mb-6 border-b-2 border-red-500 pb-2 inline-block">O que é a ProClubsLeague.com?</h3>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            A VIRTUAL PROFESSIONAL SOCCER LEAGUE é onde o futebol virtual se torna esport. Desde 2014 organizamos torneios online e GRATUITOS de Pro Clubs. Através de nossa plataforma, oferecemos a gamers e fãs de futebol, uma experiência imersiva e engajadora como nenhuma outra!
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            Criamos um sistema inovador e dinâmico, onde clubes e jogadores podem encontrar uns aos outros e lutar pelo seu lugar, enfrentando as melhores equipes do mundo! Todos podem traçar suas jornadas até o topo e construir seus legados.
          </p>
        </div>
        <div>
          <h3 className="text-xl font-bold uppercase mb-6 border-b-2 border-red-500 pb-2 inline-block">Crie seu próprio jogador</h3>
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 shadow-inner">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
                <User size={40} className="text-gray-500" />
              </div>
              <div>
                <div className="h-2 w-32 bg-gray-200 rounded mb-2"></div>
                <div className="h-2 w-20 bg-gray-200 rounded"></div>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Físico', val: '75%' },
                { label: 'Defesa', val: '45%' },
                { label: 'Drible', val: '88%' },
                { label: 'Passe', val: '82%' },
                { label: 'Chute', val: '90%' },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center gap-4">
                  <span className="text-[10px] font-bold uppercase w-12">{stat.label}</span>
                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600" style={{ width: stat.val }}></div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 mt-6 leading-tight italic">
              No Pro Clubs você pode personalizar o seu jogador do jeito que quiser. Mude elementos estéticos como cabelo, cor da pele, físico e muito mais.
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const StatBlock = ({ icon: Icon, number, label, gradient }: { icon: any, number: string, label: string, gradient: string }) => (
  <div className={`${gradient} p-8 text-white rounded-lg flex flex-col items-center justify-center text-center shadow-lg transform hover:-translate-y-1 transition-transform`}>
    <Icon size={40} className="mb-4 opacity-80" />
    <div className="text-4xl font-black mb-2 tracking-tighter">{number}</div>
    <div className="text-xs font-bold uppercase tracking-widest opacity-90">{label}</div>
  </div>
);

const Stats = () => (
  <section className="py-20 bg-gray-50">
    <div className="max-w-7xl mx-auto px-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatBlock 
          icon={Trophy}
          number="295"
          label="Campeonatos Jogados"
          gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
        />
        <StatBlock 
          icon={Globe}
          number="105715"
          label="Gols Marcados"
          gradient="bg-gradient-to-br from-indigo-500 to-purple-600"
        />
        <StatBlock 
          icon={PlayCircle}
          number="47931"
          label="Partidas Jogadas"
          gradient="bg-gradient-to-br from-purple-500 to-pink-600"
        />
        <StatBlock 
          icon={ArrowRight}
          number="116765"
          label="Jogadores Transferidos"
          gradient="bg-gradient-to-br from-blue-400 to-blue-600"
        />
      </div>
    </div>
  </section>
);

const CTA = ({ onOpenAuth }: { onOpenAuth: (mode: 'login' | 'register') => void }) => (
  <section className="py-20 bg-white text-center">
    <div className="max-w-4xl mx-auto px-6">
      <h2 className="text-2xl md:text-3xl font-medium text-gray-700 mb-10">
        Junte-se a nós! Construa sua carreira de futebol virtual na ProClubsLeague.com.
      </h2>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <button 
          onClick={() => onOpenAuth('register')}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-10 py-3 rounded font-bold uppercase tracking-wider transition-all w-full sm:w-auto"
        >
          Registre-se
        </button>
        <button 
          onClick={() => onOpenAuth('login')}
          className="bg-slate-700 hover:bg-slate-800 text-white px-10 py-3 rounded font-bold uppercase tracking-wider transition-all w-full sm:w-auto"
        >
          Entrar
        </button>
      </div>
    </div>
  </section>
);

const PublicChampionships = () => {
  const [champs, setChamps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChamp, setSelectedChamp] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/public/championships')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setChamps(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleViewTeams = (champ: any) => {
    setSelectedChamp(champ);
    setSelectedTeam(null);
    fetch(`/api/public/championships/${champ.id}/teams`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setTeams(data);
      });
  };

  const handleViewPlayers = (team: any) => {
    setSelectedTeam(team);
    fetch(`/api/public/teams/${team.id}/players`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setPlayers(data);
      });
  };

  if (loading) return null;
  if (champs.length === 0) return null;

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tighter text-gray-900">Campeonatos em Destaque</h2>
            <p className="text-gray-500 mt-2">Confira as ligas que estão acontecendo agora na ProClubs League.</p>
          </div>
          <div className="hidden md:block">
            <div className="flex items-center gap-2 text-red-500 font-bold uppercase text-xs tracking-widest">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              Ao Vivo
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-1 space-y-4">
            {champs.map((champ) => (
              <div 
                key={champ.id} 
                onClick={() => handleViewTeams(champ)}
                className={`bg-gray-50 rounded-2xl p-6 border transition-all cursor-pointer group ${selectedChamp?.id === champ.id ? 'border-red-500 bg-red-50/30 ring-1 ring-red-500' : 'border-gray-100 hover:border-gray-200'}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${selectedChamp?.id === champ.id ? 'bg-red-500 text-white' : 'bg-white text-red-500 shadow-sm border border-gray-100'}`}>
                    <Trophy size={20} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">#{champ.id}</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 uppercase mb-2">{champ.name}</h3>
                <p className="text-xs text-gray-500 line-clamp-2 mb-4">{champ.description || 'Sem descrição.'}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-gray-400">
                    <Users size={12} /> Inscrições Abertas
                  </div>
                  <ChevronRight size={16} className={`text-gray-300 transition-transform ${selectedChamp?.id === champ.id ? 'translate-x-1 text-red-500' : ''}`} />
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-2">
            {selectedChamp ? (
              <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100 min-h-[400px]">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">{selectedChamp.name}</h3>
                    <p className="text-gray-500 text-sm mt-1">{selectedChamp.description}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedChamp(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase text-gray-400 tracking-widest border-b border-gray-200 pb-2">Times Participantes</h4>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {teams.map(team => (
                        <div 
                          key={team.id}
                          onClick={() => handleViewPlayers(team)}
                          className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${selectedTeam?.id === team.id ? 'bg-white border-red-200 shadow-md' : 'bg-white/50 border-gray-100 hover:bg-white hover:border-gray-200'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${selectedTeam?.id === team.id ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                              <Shield size={16} />
                            </div>
                            <span className={`text-sm font-bold ${selectedTeam?.id === team.id ? 'text-gray-900' : 'text-gray-600'}`}>{team.name}</span>
                          </div>
                          <ChevronRight size={14} className={`text-gray-300 transition-transform ${selectedTeam?.id === team.id ? 'translate-x-1 text-red-500' : ''}`} />
                        </div>
                      ))}
                      {teams.length === 0 && (
                        <p className="text-sm text-gray-400 italic text-center py-8">Nenhum time inscrito ainda.</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase text-gray-400 tracking-widest border-b border-gray-200 pb-2">
                      {selectedTeam ? `Elenco: ${selectedTeam.name}` : 'Selecione um time'}
                    </h4>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {selectedTeam ? (
                        <>
                          {players.map(player => (
                            <div key={player.id} className="p-3 bg-white rounded-lg border border-gray-100 flex items-center gap-3">
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              <span className="text-sm text-gray-700 font-medium">{player.name}</span>
                            </div>
                          ))}
                          {players.length === 0 && (
                            <p className="text-sm text-gray-400 italic text-center py-8">Nenhum jogador listado.</p>
                          )}
                        </>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center py-12 text-center">
                          <Users size={32} className="text-gray-200 mb-2" />
                          <p className="text-xs text-gray-400">Clique em um time para ver os jogadores.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 p-12 text-center">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 text-gray-200 shadow-sm">
                  <Trophy size={40} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 uppercase mb-2">Explore as Ligas</h3>
                <p className="text-gray-400 max-w-xs">Selecione um campeonato ao lado para ver os times participantes e seus elencos.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

const Footer = () => (
  <footer className="bg-[#1a1a1a] text-gray-400 py-16 px-6">
    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
      <div>
        <h5 className="text-white font-bold uppercase text-sm mb-6">Sobre a ProClubs League</h5>
        <p className="text-xs leading-relaxed">
          A ProClubs League, criada em 7 de novembro de 2014, é a principal entidade de gerenciamento de campeonatos, jogadores e regras do modo Pro Clubs da série FIFA da EA Sports em todos os principais consoles.
        </p>
      </div>
      <div>
        <h5 className="text-white font-bold uppercase text-sm mb-6">Suporte</h5>
        <ul className="text-xs space-y-3">
          <li className="flex items-center gap-2"><Mail size={14} /> admin@proclubsleague.com</li>
          <li className="hover:text-white cursor-pointer transition-colors">Termos de Uso</li>
          <li className="mt-6 text-white font-bold uppercase">Negócios/Comercial</li>
          <li className="flex items-center gap-2"><Mail size={14} /> comercial@proclubsleague.com</li>
          <li className="flex items-center gap-2"><Phone size={14} /> New York: +1 (347) 853-8188</li>
          <li className="flex items-center gap-2"><Phone size={14} /> London: +44 (20) 8133-8826</li>
          <li className="flex items-center gap-2"><Phone size={14} /> São Paulo: +55 (11) 3280-1514</li>
        </ul>
      </div>
      <div>
        <h5 className="text-white font-bold uppercase text-sm mb-6">Comunidades</h5>
        <ul className="text-xs space-y-3">
          <li className="flex items-center gap-2 hover:text-white cursor-pointer transition-colors"><Globe size={14} /> ProClubsLeague.com</li>
          <li className="flex items-center gap-2 hover:text-white cursor-pointer transition-colors"><Monitor size={14} /> PC Origin</li>
          <li className="flex items-center gap-2 hover:text-white cursor-pointer transition-colors"><PlayCircle size={14} /> PlayStation 4</li>
          <li className="flex items-center gap-2 hover:text-white cursor-pointer transition-colors"><Gamepad2 size={14} /> Xbox One</li>
        </ul>
      </div>
      <div>
        <h5 className="text-white font-bold uppercase text-sm mb-6">Siga-nos</h5>
        <div className="flex gap-4">
          <Facebook size={20} className="hover:text-white cursor-pointer transition-colors" />
          <Twitter size={20} className="hover:text-white cursor-pointer transition-colors" />
          <Instagram size={20} className="hover:text-white cursor-pointer transition-colors" />
          <Youtube size={20} className="hover:text-white cursor-pointer transition-colors" />
        </div>
        <div className="mt-8">
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Google_Maps_icon_%282020%29.svg/1024px-Google_Maps_icon_%282020%29.svg.png" alt="Map" className="w-full h-32 object-cover rounded opacity-30 grayscale" />
        </div>
      </div>
    </div>
    <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] uppercase tracking-widest">
      <p>© 2026 ProClubs League - Virtual Professional Soccer League - Todos os direitos reservados.</p>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span>Servidores Online</span>
      </div>
    </div>
  </footer>
);

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    console.log("Checking user session...");
    fetch('/api/user')
      .then(res => res.json())
      .then(data => {
        console.log("User session data:", data);
        setIsLoggedIn(data.loggedIn);
        setUserEmail(data.email || null);
      })
      .catch(err => console.error("Error checking user:", err));
  }, []);

  const handleAuthSuccess = (email: string) => {
    setIsLoggedIn(true);
    setUserEmail(email);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      setIsLoggedIn(false);
      setUserEmail(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthInitialMode(mode);
    setIsAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-red-500 selection:text-white">
      {isLoggedIn ? (
        <AdminPanel userEmail={userEmail} onLogout={handleLogout} />
      ) : (
        <>
          <Navbar 
            isLoggedIn={isLoggedIn} 
            userEmail={userEmail} 
            onOpenAuth={() => handleOpenAuth('login')} 
            onLogout={handleLogout} 
          />
          
          <AuthModal 
            isOpen={isAuthModalOpen} 
            onClose={() => setIsAuthModalOpen(false)} 
            onAuthSuccess={handleAuthSuccess}
            initialMode={authInitialMode}
          />

          <main className="flex-grow">
            <Hero onOpenAuth={handleOpenAuth} />
            <Partners />
            <CareerStart />
            <BuildCareer />
            <Banner />
            <InfoSection />
            <PublicChampionships />
            <Stats />
            <CTA onOpenAuth={handleOpenAuth} />
          </main>
          <Footer />
        </>
      )}
    </div>
  );
}

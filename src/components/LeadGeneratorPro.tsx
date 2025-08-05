import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { useToast } from "../hooks/use-toast"
import { LeadService } from "../lib/leadService"
import { Loader2, Search, MapPin, Star, Phone, Globe } from "lucide-react"
import { Label } from "./ui/label"
import type { Lead, LeadList } from "../types"
import { motion, AnimatePresence } from "framer-motion"

const urlFormSchema = z.object({
  searchUrl: z
    .string()
    .url({ message: "Por favor, insira um link de pesquisa válido." })
    .min(1, { message: "O campo não pode estar vazio." }),
})

interface LeadGeneratorProProps {
  onLeadsGenerated?: (leads: Lead[]) => void
  existingLists?: LeadList[]
}

export function LeadGeneratorPro({ onLeadsGenerated, existingLists = [] }: LeadGeneratorProProps) {
  const [quantity, setQuantity] = useState("10")
  const [generatedLeads, setGeneratedLeads] = useState<Lead[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [showSaveOptions, setShowSaveOptions] = useState(false)
  const [saveMode, setSaveMode] = useState<'new' | 'existing'>('new')
  const [selectedListId, setSelectedListId] = useState("")
  const [newListName, setNewListName] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  
  const { toast } = useToast()

  const urlForm = useForm<z.infer<typeof urlFormSchema>>({
    resolver: zodResolver(urlFormSchema),
    defaultValues: {
      searchUrl: "",
    },
  })

  // Verificar se o formulário está preenchido para ativar o botão
  const isFormValid = urlForm.watch("searchUrl") && quantity

  const handleLeadGeneration = async (searchUrl: string, limit: number) => {
    setIsGenerating(true)
    setGeneratedLeads([])
    setShowSaveOptions(false)
    
    try {
      console.log('🚀 Iniciando geração de leads para:', searchUrl)
      const result = await LeadService.generateLeads(searchUrl, limit)

      // Verificar se está em modo demo
      if (result.demo_mode) {
        toast({
          title: "Modo Demonstração Ativado",
          description: "N8N indisponível. Usando dados de exemplo para demonstração.",
        })
      }

      if (!result.success) {
        console.error('❌ Erro na resposta do serviço:', result.error)
        toast({
          title: "Erro na Extração",
          description: result.error || "Não foi possível extrair os leads.",
          variant: "destructive",
        })
        return
      }

      if (result.leads.length === 0) {
        toast({
          title: "Nenhum lead encontrado",
          description: "Sua busca não retornou resultados. Tente um termo ou URL diferente.",
        })
        return
      }

      // Marcar todos como selecionados por padrão
      const leadsWithSelection = result.leads.map(lead => ({ ...lead, selected: true }))
      setGeneratedLeads(leadsWithSelection)
      setShowSaveOptions(true)
      
      toast({
        title: "Extração concluída!",
        description: `${result.leads.length} leads foram encontrados e extraídos com sucesso.`,
      })

      onLeadsGenerated?.(leadsWithSelection)
      urlForm.reset()

    } catch (error) {
      console.error(error)
      const errorMessage = error instanceof Error ? error.message : "Ocorreu um problema na extração. Tente novamente."
      toast({
        title: "Erro ao Gerar Leads",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const toggleLeadSelection = (index: number) => {
    setGeneratedLeads(prev => 
      prev.map((lead, i) => 
        i === index ? { ...lead, selected: !lead.selected } : lead
      )
    )
  }

  const toggleSelectAll = () => {
    const allSelected = generatedLeads.every(lead => lead.selected)
    setGeneratedLeads(prev => 
      prev.map(lead => ({ ...lead, selected: !allSelected }))
    )
  }

  const getSelectedLeads = () => generatedLeads.filter(lead => lead.selected)

  const handleSaveLeads = async () => {
    const selectedLeads = getSelectedLeads()
    
    if (selectedLeads.length === 0) {
      toast({
        title: "Nenhum lead selecionado",
        description: "Selecione pelo menos um lead para salvar.",
        variant: "destructive",
      })
      return
    }

    if (saveMode === 'new' && !newListName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite um nome para a nova lista.",
        variant: "destructive",
      })
      return
    }

    if (saveMode === 'existing' && !selectedListId) {
      toast({
        title: "Lista não selecionada",
        description: "Selecione uma lista existente.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      if (saveMode === 'new') {
        await LeadService.saveLeadList(newListName.trim(), selectedLeads)
        toast({
          title: "Lista criada!",
          description: `Nova lista "${newListName}" criada com ${selectedLeads.length} leads.`,
        })
      } else {
        await LeadService.addLeadsToList(selectedListId, selectedLeads)
        const selectedList = existingLists.find(list => list.id === selectedListId)
        toast({
          title: "Leads adicionados!",
          description: `${selectedLeads.length} leads adicionados à lista "${selectedList?.name}".`,
        })
      }

      // Limpar estado após salvar
      setGeneratedLeads([])
      setShowSaveOptions(false)
      setNewListName("")
      setSelectedListId("")

    } catch (error) {
      console.error(error)
      toast({
        title: "Erro ao salvar",
        description: error instanceof Error ? error.message : "Erro ao salvar leads.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const onUrlSubmit = (values: z.infer<typeof urlFormSchema>) => {
    handleLeadGeneration(values.searchUrl, parseInt(quantity))
  }

  const renderStars = (rating?: number) => {
    if (!rating) return <span className="text-xs text-gray-400">Sem avaliação</span>
    
    return (
      <div className="flex items-center space-x-1">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={`w-3 h-3 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
          />
        ))}
        <span className="text-xs text-gray-600 ml-1">({rating})</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Formulário de Geração */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="w-5 h-5" />
            <span>Extração de Leads</span>
          </CardTitle>
          <CardDescription>
            Cole o link de pesquisa do Google Maps para encontrar novos leads.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...urlForm}>
            <form
              onSubmit={urlForm.handleSubmit(onUrlSubmit)}
              className="flex flex-col space-y-4"
            >
              <FormField
                control={urlForm.control}
                name="searchUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL de Pesquisa do Google Maps</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Cole aqui o link de pesquisa do Google Maps..."
                        {...field}
                        disabled={isGenerating}
                        className="text-base"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-2">
                <Label>Quantidade de Leads</Label>
                <Select onValueChange={setQuantity} defaultValue={quantity} disabled={isGenerating}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg">
                    <SelectItem value="10">10 Leads</SelectItem>
                    <SelectItem value="20">20 Leads</SelectItem>
                    <SelectItem value="30">30 Leads</SelectItem>
                    <SelectItem value="40">40 Leads</SelectItem>
                    <SelectItem value="50">50 Leads</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <motion.div
                initial={{ scale: 1 }}
                animate={{ 
                  scale: isFormValid ? 1.02 : 1,
                  boxShadow: isFormValid ? "0 10px 25px rgba(59, 130, 246, 0.3)" : "0 1px 3px rgba(0, 0, 0, 0.1)"
                }}
                transition={{ duration: 0.3 }}
              >
                <Button
                  type="submit"
                  className={`w-full transition-all duration-300 ${
                    isFormValid 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-1' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  disabled={isGenerating || !isFormValid}
                  size="lg"
                >
                  {isGenerating ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center"
                    >
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Extraindo leads...
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center"
                    >
                      <Search className="mr-2 h-4 w-4" />
                      {isFormValid ? '🚀 Iniciar Extração' : 'Preencha os campos acima'}
                    </motion.div>
                  )}
                </Button>
              </motion.div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Lista de Leads Gerados */}
      <AnimatePresence>
        {generatedLeads.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <MapPin className="w-5 h-5" />
                      <span>Leads Encontrados ({generatedLeads.length})</span>
                    </CardTitle>
                    <CardDescription>
                      Selecione os leads que deseja salvar
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleSelectAll}
                  >
                    {generatedLeads.every(lead => lead.selected) ? 'Desmarcar Todos' : 'Selecionar Todos'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {generatedLeads.map((lead, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        lead.selected 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => toggleLeadSelection(index)}
                    >
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          checked={lead.selected}
                          onChange={() => toggleLeadSelection(index)}
                          className="mt-1"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm truncate">{lead.name}</h3>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{lead.address}</p>
                          
                          {lead.rating && (
                            <div className="mt-2">
                              {renderStars(lead.rating)}
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-4 mt-2">
                            {lead.phone && (
                              <div className="flex items-center space-x-1 text-xs text-gray-500">
                                <Phone className="w-3 h-3" />
                                <span className="truncate">{lead.phone}</span>
                              </div>
                            )}
                            {lead.website && (
                              <div className="flex items-center space-x-1 text-xs text-blue-600">
                                <Globe className="w-3 h-3" />
                                <span>Website</span>
                              </div>
                            )}
                          </div>
                          
                          {lead.business_type && (
                            <div className="mt-2">
                              <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                                {lead.business_type}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Opções de Salvamento */}
      <AnimatePresence>
        {showSaveOptions && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Salvar Leads Selecionados</CardTitle>
                <CardDescription>
                  {getSelectedLeads().length} leads selecionados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="saveMode"
                        checked={saveMode === 'new'}
                        onChange={() => setSaveMode('new')}
                      />
                      <span>Criar nova lista</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="saveMode"
                        checked={saveMode === 'existing'}
                        onChange={() => setSaveMode('existing')}
                        disabled={existingLists.length === 0}
                      />
                      <span>Adicionar à lista existente</span>
                    </label>
                  </div>

                  {saveMode === 'new' && (
                    <Input
                      placeholder="Nome da nova lista"
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                    />
                  )}

                  {saveMode === 'existing' && (
                    <Select value={selectedListId} onValueChange={setSelectedListId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma lista..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-lg">
                        {existingLists.map((list) => (
                          <SelectItem key={list.id} value={list.id}>
                            {list.name} ({list.total_leads} leads)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="flex space-x-3">
                  <Button
                    onClick={handleSaveLeads}
                    disabled={isSaving || getSelectedLeads().length === 0}
                    className="flex-1"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      `Salvar ${getSelectedLeads().length} leads`
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowSaveOptions(false)
                      setGeneratedLeads([])
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
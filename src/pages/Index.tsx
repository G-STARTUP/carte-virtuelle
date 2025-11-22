import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import { CreditCard, Globe, Shield, Zap, Wallet, ArrowRight, UserCheck, Repeat, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import Reveal from "@/components/Reveal";
import heroCardsImage from "@/assets/hero-cards.png";

const Index = () => {
  const features = [
    {
      category: "Paiements",
      items: [
        { icon: CreditCard, title: "Cartes virtuelles", description: "Visa/Mastercard en quelques secondes." },
        { icon: Globe, title: "Portée mondiale", description: "Utilisable sur la plupart des sites internationaux." },
      ],
    },
    {
      category: "Comptes & Devises",
      items: [
        { icon: Wallet, title: "Multi‑wallet", description: "USD & XOF (extensible)." },
        { icon: Repeat, title: "Rechargement rapide", description: "Ajout instantané de solde carte." },
      ],
    },
    {
      category: "Sécurité & Confiance",
      items: [
        { icon: Shield, title: "Protection", description: "Isolation des fonds + contrôle granularité." },
        { icon: ShieldCheck, title: "Conformité", description: "KYC utilisateur pour un écosystème sain." },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Nouveau Hero */}
      <section className="pt-28 pb-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute -top-32 left-1/3 w-[600px] h-[600px] rounded-full bg-gradient-primary opacity-10 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-gradient-card opacity-10 blur-2xl" />
        </div>
        <div className="container mx-auto max-w-6xl relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Contenu gauche */}
            <div className="space-y-8">
              <Reveal className="flex justify-start gap-2 flex-wrap">
                <span className="px-4 py-1.5 rounded-full bg-gradient-card text-primary text-xs font-semibold tracking-wide shadow-sm">Cartes virtuelles internationales</span>
                <span className="px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">Sandbox démo</span>
              </Reveal>
              <Reveal className="reveal delay-[60ms]">
                <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight">
                  Simplifiez vos paiements
                  <br />
                  <span className="bg-gradient-primary bg-clip-text text-transparent">créez – rechargez – payez</span>
                </h1>
              </Reveal>
              <Reveal className="reveal delay-[120ms]">
                <p className="text-lg text-muted-foreground max-w-xl">
                  Plateforme moderne pour générer et gérer des cartes virtuelles multi‑devises, adaptées aux achats internationaux et tests d'intégration.
                </p>
              </Reveal>
              <Reveal className="reveal delay-[180ms]">
                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <Link to="/auth">
                    <Button size="lg" className="bg-gradient-primary shadow-glow text-base md:text-lg h-13 px-8">
                      Commencer gratuitement <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                  <Button size="lg" variant="outline" className="text-base md:text-lg h-13 px-8">
                    Documentation API
                  </Button>
                </div>
              </Reveal>
            </div>
            
            {/* Image droite */}
            <Reveal className="reveal delay-[240ms]">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-primary opacity-20 blur-3xl rounded-full" />
                <img 
                  src={heroCardsImage} 
                  alt="Cartes virtuelles VirtualPay" 
                  className="relative w-full h-auto rounded-2xl shadow-glow"
                />
              </div>
            </Reveal>
          </div>
          
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-16">
            <Card className="p-6 md:p-8 bg-gradient-card shadow-glow border-border/50">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[
                  { currency: 'USD', balance: '$2,450.00', color: 'from-blue-500 to-cyan-500' },
                  { currency: 'XOF', balance: '450,000 F', color: 'from-purple-500 to-pink-500' },
                  { currency: 'USD', balance: '$610.20', color: 'from-emerald-500 to-teal-500' },
                ].map((wallet,i) => (
                  <div key={i} className={`relative p-5 rounded-2xl bg-gradient-to-br ${wallet.color} text-white shadow-lg overflow-hidden`}>
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-10 h-7 bg-white/20 rounded-md backdrop-blur-sm" />
                      <CreditCard className="w-6 h-6 opacity-80" />
                    </div>
                    <p className="text-[11px] tracking-wide opacity-80 mb-1">Solde disponible</p>
                    <p className="text-xl font-semibold">{wallet.balance}</p>
                    <p className="text-[10px] opacity-70 mt-3 uppercase">{wallet.currency} Wallet</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Section Confiance */}
      <section className="py-10 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold">Sécurité & Confiance</h2>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-3"><Shield className="h-5 w-5 text-primary" /> Isolation des fonds et séparation des environnements sandbox.</li>
                <li className="flex gap-3"><UserCheck className="h-5 w-5 text-primary" /> Processus KYC utilisateur pour réduire la fraude.</li>
                <li className="flex gap-3"><ShieldCheck className="h-5 w-5 text-primary" /> Flux de rechargement contrôlé avec frais transparents.</li>
                <li className="flex gap-3"><Repeat className="h-5 w-5 text-primary" /> Mise à jour de solde temps quasi réel.</li>
              </ul>
            </div>
            <div className="grid grid-cols-3 gap-4 lg:gap-6">
              {Array.from({length:6}).map((_,i)=> (
                <div key={i} className="h-16 rounded-lg border border-border/60 bg-card flex items-center justify-center opacity-70 text-[10px] font-medium tracking-wide">
                  LOGO
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section refactor */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl space-y-14">
          <div className="text-center space-y-3">
            <h2 className="text-4xl font-bold">Ce que vous obtenez</h2>
            <p className="text-lg text-muted-foreground">Un écosystème modulable pour expérimenter et exécuter vos paiements.</p>
          </div>
          <div className="space-y-10">
            {features.map(group => (
              <Reveal key={group.category} className="space-y-4 reveal">
                <h3 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                  <span className="px-2 py-1 rounded-md bg-gradient-card text-primary text-xs font-medium">{group.category}</span>
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {group.items.map(item => (
                    <Card key={item.title} className="p-5 border-border/50 hover:shadow-glow transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center mb-3">
                        <item.icon className="w-5 h-5 text-white" />
                      </div>
                      <h4 className="text-base font-semibold mb-1">{item.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                    </Card>
                  ))}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold">Comment ça marche</h2>
            <p className="text-muted-foreground text-lg">Un parcours linéaire en 4 étapes pour démarrer.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              {step:'1',title:'Créer le compte',desc:'Inscription + vérification email.'},
              {step:'2',title:'Profil client',desc:'Compléter KYC de base.'},
              {step:'3',title:'Créer carte',desc:'Générer et initialiser le solde.'},
              {step:'4',title:'Recharger & payer',desc:'Utiliser la carte sur sites marchands.'},
            ].map(s => (
              <Reveal key={s.step} className="reveal">
              <Card className="p-6 flex flex-col gap-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-card opacity-20 rounded-bl-2xl" />
                <div className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">{s.step}</div>
                <h4 className="font-semibold text-sm tracking-wide">{s.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
              </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Section Partenaires */}
      <section className="py-20 px-4 bg-muted/20">
        <div className="container mx-auto max-w-6xl space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold">Partenaires & Intégrations</h2>
            <p className="text-muted-foreground text-sm">Exemples / placeholders – remplacez par vos logos réels.</p>
          </div>
          <div className="grid sm:grid-cols-3 md:grid-cols-6 gap-4">
            {['STROWALLET','NOWPAYMENTS','SUPABASE','REACT','TAILWIND','LUCIDE'].map(name => (
              <Reveal key={name} className="reveal">
                <div className="h-20 rounded-lg border border-border/50 bg-card flex items-center justify-center text-[11px] font-semibold tracking-wide">
                  {name}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Section Tarifs */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold">Tarifs simplifiés</h2>
            <p className="text-muted-foreground text-sm">Modèle fictif – adaptez selon votre stratégie.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[{
              name:'Starter',price:'Gratuit',desc:'Sandbox illimitée',features:['Cartes virtuelles test','2 devises','Rechargement instantané','Docs API']},
              {name:'Pro',price:'29$/mois',desc:'Usage élargi',features:['Cartes de prod','Priorité support','Limites élevées','Webhooks avancés']},
              {name:'Enterprise',price:'Sur devis',desc:'Personnalisation & volume',features:['SLA dédié','Intégration custom','Monitoring étendu','Support technique']},
            ].map(plan => (
              <Reveal key={plan.name} className="reveal">
              <Card className="p-6 flex flex-col gap-4 border-border/50">
                <div>
                  <h3 className="text-xl font-semibold">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{plan.desc}</p>
                </div>
                <div className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">{plan.price}</div>
                <ul className="space-y-2 text-xs">
                  {plan.features.map(f => <li key={f} className="flex gap-2"><span className="text-primary">✔</span>{f}</li>)}
                </ul>
                <Button className="mt-2 bg-gradient-primary shadow-glow" variant="default">Choisir</Button>
              </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Section FAQ */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold">FAQ</h2>
            <p className="text-sm text-muted-foreground">Questions fréquentes (exemples).</p>
          </div>
          <div className="space-y-4">
            {[{
              q:'Les cartes sont-elles réellement utilisables ?',a:'Dans cet environnement sandbox elles servent à simuler vos intégrations avant passage en production.'},
              {q:'Quelles devises disponibles ?',a:'USD et XOF actuellement, extensible selon besoins.'},
              {q:'Le KYC est-il obligatoire ?',a:'Oui pour activer les fonctionnalités critiques et limites accrues.'},
              {q:'Comment fonctionne le rechargement ?',a:'Vous initialisez un montant puis pouvez recharger à tout moment avec calcul transparent des frais.'},
              {q:'Puis-je accéder à une API ?',a:'Oui, endpoints REST (exemple), documentation à venir.'},
            ].map(item => (
              <Reveal key={item.q} className="reveal">
                <Card className="p-5 border-border/50">
                  <h4 className="font-medium mb-1 text-sm">{item.q}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.a}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section améliorée */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-5xl">
          <Card className="p-10 md:p-14 text-center bg-gradient-card border-border/50 shadow-glow space-y-8">
            <h2 className="text-4xl font-bold">Prêt à créer votre première carte ?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Lancez-vous maintenant et explorez la génération de cartes virtuelles dans un environnement sécurisé.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" className="bg-gradient-primary shadow-glow h-13 px-8 text-base md:text-lg">Créer mon compte <ArrowRight className="ml-2 w-5 h-5" /></Button>
              </Link>
              <Button size="lg" variant="outline" className="h-13 px-8 text-base md:text-lg">Accéder à l'API</Button>
            </div>
            <div className="grid sm:grid-cols-3 gap-6 pt-6 text-left">
              {[
                {label:'Support réactif',desc:'Canal dédié pour questions de test.'},
                {label:'Roadmap ouverte',desc:'Évolutions régulières orientées développeurs.'},
                {label:'Sandbox gratuite',desc:'Aucune carte bancaire réelle nécessaire.'},
              ].map(item => (
                <div key={item.label} className="text-sm">
                  <h5 className="font-semibold mb-1">{item.label}</h5>
                  <p className="text-muted-foreground text-xs leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold">VirtualPay</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 VirtualPay. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;

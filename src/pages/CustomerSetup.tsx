import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { useStrowallet } from "@/hooks/useStrowallet";
import { uploadKycFile } from "@/lib/uploadKycFile";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreditCard, ArrowLeft, LogOut, FileCheck, Edit, X, Eye } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const CustomerSetup = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { createCustomer, getUserCustomer, updateCustomer, loading } = useStrowallet();
  const [existingCustomer, setExistingCustomer] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [idFile, setIdFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    customer_email: "",
    phone: "",
    date_of_birth: "",
    address: "",
    city: "Accra",
    state: "Accra",
    zip_code: "",
    country: "Ghana",
    id_type: "PASSPORT",
    id_number: "",
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    checkExistingCustomer();
  }, [user, navigate]);

  const checkExistingCustomer = async () => {
    try {
      const customer = await getUserCustomer();
      if (customer) {
        setExistingCustomer(customer);
        // Pre-fill form with existing data
        if (customer.data) {
          const data = customer.data as Record<string, any>;
          setFormData({
            first_name: data?.firstName || customer.first_name || "",
            last_name: data?.lastName || customer.last_name || "",
            customer_email: customer.customer_email || "",
            phone: data?.phoneNumber || customer.phone_number || "",
            date_of_birth: data?.dateOfBirth || "",
            address: data?.line1 || "",
            city: data?.city || "Accra",
            state: data?.state || "Accra",
            zip_code: data?.zipCode || "",
            country: data?.country || "Ghana",
            id_type: data?.idType || "PASSPORT",
            id_number: data?.idNumber || "",
          });
        }
      }
    } catch (error) {
      // No customer yet, that's fine
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    setUploading(true);
    try {
      let id_image = '';
      let user_photo = '';

      // Upload files if provided
      if (idFile) {
        toast.info("Upload du document d'identité...");
        id_image = await uploadKycFile(idFile, user.id, 'id');
      }

      if (photoFile) {
        toast.info("Upload de la photo...");
        user_photo = await uploadKycFile(photoFile, user.id, 'photo');
      }

      if (existingCustomer && editMode) {
        // Update existing customer
        await updateCustomer({
          customer_id: existingCustomer.customer_id,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone_number: formData.phone,
          ...(id_image && { id_image }),
          ...(user_photo && { user_photo }),
        });
        
        setEditMode(false);
        await checkExistingCustomer();
      } else {
        // Create new customer
        await createCustomer({
          ...formData,
          id_image,
          user_photo,
        });
        
        navigate("/cards");
      }
    } catch (error: any) {
      console.error("Error with customer:", error);
      toast.error(error.message || "Erreur lors de l'opération");
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (existingCustomer && !editMode) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  VirtualPay
                </span>
              </div>
            </div>
            <Button variant="ghost" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Profil KYC</h1>
              <p className="text-muted-foreground">
                Vos informations de vérification d'identité
              </p>
            </div>
            <Button onClick={() => setEditMode(true)} className="bg-gradient-primary">
              <Edit className="w-4 h-4 mr-2" />
              Modifier le profil
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <Card className="p-6 border-border/50">
              <h3 className="text-lg font-semibold mb-4">Informations personnelles</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Nom complet</p>
                  <p className="font-medium">{existingCustomer.first_name} {existingCustomer.last_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{existingCustomer.customer_email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Téléphone</p>
                  <p className="font-medium">{existingCustomer.phone_number || 'Non renseigné'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ID Client</p>
                  <p className="font-mono text-xs">{existingCustomer.customer_id}</p>
                </div>
              </div>
            </Card>

            {/* KYC Documents */}
            <Card className="p-6 border-border/50">
              <h3 className="text-lg font-semibold mb-4">Documents KYC</h3>
              <div className="space-y-4">
                {existingCustomer.id_image_url && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">Document d'identité</p>
                      <Badge variant="default" className="bg-green-500">
                        <FileCheck className="w-3 h-3 mr-1" />
                        Vérifié
                      </Badge>
                    </div>
                    <a 
                      href={existingCustomer.id_image_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <Eye className="w-4 h-4" />
                      Voir le document
                    </a>
                  </div>
                )}

                {existingCustomer.user_photo_url && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">Photo utilisateur</p>
                      <Badge variant="default" className="bg-green-500">
                        <FileCheck className="w-3 h-3 mr-1" />
                        Vérifié
                      </Badge>
                    </div>
                    <a 
                      href={existingCustomer.user_photo_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <Eye className="w-4 h-4" />
                      Voir la photo
                    </a>
                  </div>
                )}

                {(existingCustomer.data as Record<string, any>)?.idType && (
                  <div>
                    <p className="text-sm text-muted-foreground">Type de document</p>
                    <p className="font-medium">{(existingCustomer.data as Record<string, any>).idType}</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Address Information */}
            {existingCustomer.data && (
              <Card className="p-6 border-border/50 md:col-span-2">
                <h3 className="text-lg font-semibold mb-4">Adresse</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {(existingCustomer.data as Record<string, any>)?.line1 && (
                    <div>
                      <p className="text-sm text-muted-foreground">Rue</p>
                      <p className="font-medium">{(existingCustomer.data as Record<string, any>).line1}</p>
                    </div>
                  )}
                  {(existingCustomer.data as Record<string, any>)?.city && (
                    <div>
                      <p className="text-sm text-muted-foreground">Ville</p>
                      <p className="font-medium">{(existingCustomer.data as Record<string, any>).city}</p>
                    </div>
                  )}
                  {(existingCustomer.data as Record<string, any>)?.country && (
                    <div>
                      <p className="text-sm text-muted-foreground">Pays</p>
                      <p className="font-medium">{(existingCustomer.data as Record<string, any>).country}</p>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>

          <div className="mt-6 flex justify-center">
            <Link to="/cards">
              <Button className="bg-gradient-primary shadow-glow">
                Aller à mes cartes
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {editMode ? (
              <Button variant="ghost" size="icon" onClick={() => {
                setEditMode(false);
                setIdFile(null);
                setPhotoFile(null);
              }}>
                <X className="w-5 h-5" />
              </Button>
            ) : (
              <Link to="/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
            )}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                VirtualPay
              </span>
            </div>
          </div>

          <Button variant="ghost" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Déconnexion
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {editMode ? "Mettre à jour mon profil KYC" : "Configuration du profil client"}
          </h1>
          <p className="text-muted-foreground">
            {editMode 
              ? "Modifiez vos informations et documents d'identité" 
              : "Créez votre profil Strowallet pour pouvoir créer des cartes virtuelles"
            }
          </p>
        </div>

        <Card className="p-6 border-border/50">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">Prénom *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => handleChange("first_name", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">Nom *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => handleChange("last_name", e.target.value)}
                  required
                />
              </div>
            </div>

            {!editMode && (
              <div className="space-y-2">
                <Label htmlFor="customer_email">Email *</Label>
                <Input
                  id="customer_email"
                  type="email"
                  value={formData.customer_email}
                  onChange={(e) => handleChange("customer_email", e.target.value)}
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+225 XX XX XX XX"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                required
              />
            </div>

            {!editMode && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date de naissance *</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => handleChange("date_of_birth", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="id_type">Type de pièce d'identité *</Label>
                  <Select 
                    value={formData.id_type} 
                    onValueChange={(value) => handleChange("id_type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PASSPORT">Passeport</SelectItem>
                      <SelectItem value="NATIONAL_ID">Carte d'identité nationale</SelectItem>
                      <SelectItem value="DRIVERS_LICENSE">Permis de conduire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="id_number">Numéro de pièce d'identité</Label>
                  <Input
                    id="id_number"
                    value={formData.id_number}
                    onChange={(e) => handleChange("id_number", e.target.value)}
                    placeholder="Optionnel - un numéro sera généré si vide"
                  />
                </div>
              </>
            )}

            {/* ID Document Upload */}
            <div className="space-y-2">
              <Label htmlFor="id_document">
                {editMode ? "Nouveau document d'identité (optionnel)" : "Document d'identité *"}
                {idFile && <FileCheck className="inline w-4 h-4 ml-2 text-green-500" />}
              </Label>
              {editMode && existingCustomer?.id_image_url && (
                <div className="mb-2">
                  <a 
                    href={existingCustomer.id_image_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    Document actuel
                  </a>
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  id="id_document"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 10485760) {
                        toast.error("Le fichier ne doit pas dépasser 10MB");
                        e.target.value = '';
                        return;
                      }
                      setIdFile(file);
                      toast.success("Document sélectionné");
                    }
                  }}
                  className="cursor-pointer"
                  required={!editMode}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Format: JPG, PNG, PDF (max 10MB)
              </p>
            </div>

            {/* User Photo Upload */}
            <div className="space-y-2">
              <Label htmlFor="user_photo">
                {editMode ? "Nouvelle photo utilisateur (optionnel)" : "Photo utilisateur *"}
                {photoFile && <FileCheck className="inline w-4 h-4 ml-2 text-green-500" />}
              </Label>
              {editMode && existingCustomer?.user_photo_url && (
                <div className="mb-2">
                  <a 
                    href={existingCustomer.user_photo_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    Photo actuelle
                  </a>
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  id="user_photo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 10485760) {
                        toast.error("Le fichier ne doit pas dépasser 10MB");
                        e.target.value = '';
                        return;
                      }
                      setPhotoFile(file);
                      toast.success("Photo sélectionnée");
                    }
                  }}
                  className="cursor-pointer"
                  required={!editMode}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Format: JPG, PNG (max 10MB)
              </p>
            </div>

            {!editMode && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="address">Adresse *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Ville *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleChange("city", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">État/Région *</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => handleChange("state", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="zip_code">Code postal</Label>
                    <Input
                      id="zip_code"
                      value={formData.zip_code}
                      onChange={(e) => handleChange("zip_code", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">Pays *</Label>
                    <Select 
                      value={formData.country} 
                      onValueChange={(value) => handleChange("country", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px] overflow-y-auto">
                        <SelectItem value="Ghana">Ghana</SelectItem>
                        <SelectItem value="France">France</SelectItem>
                        <SelectItem value="Senegal">Sénégal</SelectItem>
                        <SelectItem value="Cote d'Ivoire">Côte d'Ivoire</SelectItem>
                        <SelectItem value="Mali">Mali</SelectItem>
                        <SelectItem value="Burkina Faso">Burkina Faso</SelectItem>
                        <SelectItem value="Niger">Niger</SelectItem>
                        <SelectItem value="Benin">Bénin</SelectItem>
                        <SelectItem value="Togo">Togo</SelectItem>
                        <SelectItem value="Canada">Canada</SelectItem>
                        <SelectItem value="United States">États-Unis</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            <div className="pt-4 flex gap-4">
              <Button
                type="submit"
                disabled={uploading || loading}
                className="flex-1 bg-gradient-primary shadow-glow"
              >
                {uploading || loading
                  ? "Traitement..."
                  : editMode
                  ? "Enregistrer les modifications"
                  : "Créer mon profil"}
              </Button>
              {editMode && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditMode(false);
                    setIdFile(null);
                    setPhotoFile(null);
                  }}
                >
                  Annuler
                </Button>
              )}
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
};

export default CustomerSetup;

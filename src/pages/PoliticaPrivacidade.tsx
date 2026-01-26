import { Link } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const PoliticaPrivacidade = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link to="/login">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">
              Política de Privacidade
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>

        {/* Content */}
        <div className="bg-card rounded-lg shadow-sm border p-6 sm:p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              1. Introdução
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              A Alerta Rastreamento ("nós", "nosso" ou "empresa") está comprometida em proteger a 
              privacidade e segurança dos dados pessoais de nossos usuários. Esta Política de 
              Privacidade descreve como coletamos, usamos, armazenamos e protegemos suas informações 
              pessoais quando você utiliza nossos serviços de rastreamento de veículos.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              2. Informações que Coletamos
            </h2>
            <div className="space-y-3 text-muted-foreground">
              <div>
                <h3 className="font-semibold text-foreground mb-2">2.1. Informações Pessoais</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Nome completo</li>
                  <li>Endereço de e-mail</li>
                  <li>Número de telefone</li>
                  <li>Documentos de identificação (CPF, CNH, etc.)</li>
                  <li>Endereço residencial e comercial</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">2.2. Informações de Veículos</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Placa do veículo</li>
                  <li>Modelo e marca</li>
                  <li>Ano de fabricação</li>
                  <li>Número do chassi</li>
                  <li>Dados do rastreador instalado</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">2.3. Dados de Localização</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Coordenadas GPS em tempo real</li>
                  <li>Histórico de localizações</li>
                  <li>Rotas percorridas</li>
                  <li>Velocidade e direção do veículo</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">2.4. Dados de Uso</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Logs de acesso ao sistema</li>
                  <li>Preferências de configuração</li>
                  <li>Histórico de transações</li>
                  <li>Informações de pagamento</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              3. Como Utilizamos suas Informações
            </h2>
            <div className="space-y-3 text-muted-foreground">
              <p>Utilizamos suas informações pessoais para:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Fornecer e melhorar nossos serviços de rastreamento</li>
                <li>Processar pagamentos e gerenciar assinaturas</li>
                <li>Enviar notificações e alertas sobre seus veículos</li>
                <li>Comunicar-nos com você sobre atualizações e novidades</li>
                <li>Cumprir obrigações legais e regulatórias</li>
                <li>Prevenir fraudes e garantir a segurança</li>
                <li>Realizar análises e melhorias em nossos serviços</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              4. Compartilhamento de Informações
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Não vendemos suas informações pessoais. Podemos compartilhar seus dados apenas nas 
              seguintes situações:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
              <li>Com prestadores de serviços que nos auxiliam na operação (armazenamento de dados, processamento de pagamentos)</li>
              <li>Quando exigido por lei ou ordem judicial</li>
              <li>Para proteger nossos direitos, propriedade ou segurança</li>
              <li>Com seu consentimento explícito</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              5. Segurança dos Dados
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Implementamos medidas de segurança técnicas e organizacionais adequadas para proteger 
              suas informações pessoais contra acesso não autorizado, alteração, divulgação ou 
              destruição. Isso inclui criptografia, controles de acesso e monitoramento regular 
              de nossos sistemas.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              6. Seus Direitos (LGPD)
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem os seguintes direitos:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
              <li><strong className="text-foreground">Acesso:</strong> Solicitar informações sobre seus dados pessoais</li>
              <li><strong className="text-foreground">Correção:</strong> Solicitar correção de dados incompletos ou desatualizados</li>
              <li><strong className="text-foreground">Exclusão:</strong> Solicitar a exclusão de dados desnecessários</li>
              <li><strong className="text-foreground">Portabilidade:</strong> Solicitar a portabilidade dos seus dados</li>
              <li><strong className="text-foreground">Revogação:</strong> Revogar seu consentimento a qualquer momento</li>
              <li><strong className="text-foreground">Oposição:</strong> Opor-se ao tratamento de dados em certas circunstâncias</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              7. Retenção de Dados
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Mantemos suas informações pessoais apenas pelo tempo necessário para cumprir os 
              propósitos descritos nesta política, a menos que um período de retenção mais longo 
              seja exigido ou permitido por lei. Dados de localização são mantidos conforme 
              necessário para fornecer o serviço de rastreamento.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              8. Cookies e Tecnologias Similares
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Utilizamos cookies e tecnologias similares para melhorar sua experiência, analisar 
              o uso do serviço e personalizar conteúdo. Você pode gerenciar suas preferências de 
              cookies através das configurações do seu navegador.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              9. Alterações nesta Política
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você 
              sobre mudanças significativas publicando a nova política nesta página e atualizando 
              a data de "Última atualização". Recomendamos que você revise esta política 
              regularmente.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              10. Contato
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Se você tiver dúvidas, preocupações ou solicitações relacionadas a esta Política 
              de Privacidade ou ao tratamento de seus dados pessoais, entre em contato conosco:
            </p>
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-foreground font-semibold mb-2">Alerta Rastreamento</p>
              <p className="text-muted-foreground">E-mail: contato@alertarastreamento.com.br</p>
              <p className="text-muted-foreground">Telefone: +55 31 3318-8489</p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Ao utilizar nossos serviços, você concorda com esta Política de Privacidade.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PoliticaPrivacidade;

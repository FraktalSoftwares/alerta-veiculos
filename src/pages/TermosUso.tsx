import { Link } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

const TermosUso = () => {
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
            <FileText className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">
              Termos de Uso
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
              1. Aceitação dos Termos
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Ao acessar e utilizar os serviços da Alerta Rastreamento ("Serviço"), você concorda 
              em cumprir e estar vinculado a estes Termos de Uso. Se você não concordar com 
              qualquer parte destes termos, não deve utilizar nossos serviços.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              2. Descrição do Serviço
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              A Alerta Rastreamento oferece serviços de rastreamento e monitoramento de veículos, 
              incluindo, mas não limitado a:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
              <li>Rastreamento em tempo real de veículos</li>
              <li>Histórico de localizações e rotas</li>
              <li>Alertas e notificações de eventos</li>
              <li>Gestão de cercas virtuais (geofencing)</li>
              <li>Relatórios e análises de uso</li>
              <li>Integração com sistemas de gestão</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              3. Cadastro e Conta de Usuário
            </h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                Para utilizar nossos serviços, você precisa criar uma conta fornecendo informações 
                precisas e atualizadas. Você é responsável por:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Manter a confidencialidade de suas credenciais de acesso</li>
                <li>Notificar-nos imediatamente sobre qualquer uso não autorizado de sua conta</li>
                <li>Ser responsável por todas as atividades que ocorram em sua conta</li>
                <li>Fornecer informações verdadeiras e atualizadas</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              4. Uso Aceitável
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Você concorda em utilizar o Serviço apenas para fins legais e de acordo com estes 
              Termos. É proibido:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
              <li>Utilizar o serviço para atividades ilegais ou não autorizadas</li>
              <li>Rastrear veículos sem autorização do proprietário</li>
              <li>Interferir ou interromper o funcionamento do Serviço</li>
              <li>Tentar acessar áreas restritas do sistema</li>
              <li>Reproduzir, duplicar ou revender o Serviço sem autorização</li>
              <li>Utilizar o Serviço para violar direitos de terceiros</li>
              <li>Transmitir vírus, malware ou código malicioso</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              5. Assinaturas e Pagamentos
            </h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                O uso do Serviço pode estar sujeito a taxas de assinatura. Ao assinar nossos 
                serviços, você concorda em:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Pagar todas as taxas associadas ao seu plano de assinatura</li>
                <li>Manter informações de pagamento atualizadas</li>
                <li>Autorizar cobranças automáticas conforme seu plano</li>
                <li>Entender que as taxas são não reembolsáveis, exceto conforme previsto em lei</li>
              </ul>
              <p className="mt-3">
                Reservamo-nos o direito de modificar os preços com aviso prévio de 30 dias. 
                O cancelamento da assinatura pode ser feito a qualquer momento, mas não há 
                reembolso para períodos já pagos.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              6. Propriedade Intelectual
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Todo o conteúdo do Serviço, incluindo software, design, textos, gráficos, logos e 
              outros materiais, é propriedade da Alerta Rastreamento ou de seus licenciadores e 
              está protegido por leis de propriedade intelectual. Você não pode copiar, modificar, 
              distribuir ou criar trabalhos derivados sem autorização prévia por escrito.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              7. Disponibilidade do Serviço
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Embora nos esforcemos para manter o Serviço disponível 24/7, não garantimos 
              disponibilidade ininterrupta ou livre de erros. Podemos realizar manutenções 
              programadas ou de emergência que podem resultar em interrupções temporárias. 
              Não seremos responsáveis por perdas resultantes de indisponibilidade do Serviço.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              8. Limitação de Responsabilidade
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Na máxima extensão permitida por lei:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
              <li>O Serviço é fornecido "como está" e "conforme disponível"</li>
              <li>Não garantimos que o Serviço atenderá a todos os seus requisitos</li>
              <li>Não seremos responsáveis por danos indiretos, incidentais ou consequenciais</li>
              <li>Nossa responsabilidade total não excederá o valor pago por você nos últimos 12 meses</li>
              <li>Não garantimos a precisão absoluta dos dados de localização</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              9. Indenização
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Você concorda em indenizar e isentar a Alerta Rastreamento, seus diretores, 
              funcionários e parceiros de qualquer reclamação, dano, perda, responsabilidade 
              e despesa (incluindo honorários advocatícios) decorrentes do seu uso do Serviço 
              ou violação destes Termos.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              10. Rescisão
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Podemos suspender ou encerrar sua conta e acesso ao Serviço imediatamente, 
              sem aviso prévio, se você:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
              <li>Violar estes Termos de Uso</li>
              <li>Não efetuar pagamentos devidos</li>
              <li>Utilizar o Serviço de forma fraudulenta ou ilegal</li>
              <li>Não utilizar a conta por um período prolongado</li>
            </ul>
            <p className="mt-3">
              Você pode cancelar sua conta a qualquer momento através das configurações da conta 
              ou entrando em contato conosco.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              11. Modificações dos Termos
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Reservamo-nos o direito de modificar estes Termos a qualquer momento. 
              Alterações significativas serão comunicadas através do Serviço ou por e-mail. 
              O uso continuado do Serviço após as modificações constitui aceitação dos novos Termos.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              12. Lei Aplicável e Jurisdição
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Estes Termos são regidos pelas leis brasileiras. Qualquer disputa relacionada a 
              estes Termos será resolvida nos tribunais competentes do Brasil, com renúncia 
              expressa a qualquer outro foro.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              13. Disposições Gerais
            </h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                Se qualquer disposição destes Termos for considerada inválida ou inexequível, 
                as demais disposições permanecerão em pleno vigor. Estes Termos constituem o 
                acordo completo entre você e a Alerta Rastreamento em relação ao uso do Serviço.
              </p>
              <p>
                Nossa falha em exercer ou fazer valer qualquer direito ou disposição destes 
                Termos não constituirá uma renúncia a tal direito ou disposição.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              14. Contato
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Para questões relacionadas a estes Termos de Uso, entre em contato conosco:
            </p>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-foreground font-semibold mb-2">Alerta Rastreamento</p>
              <p className="text-muted-foreground">E-mail: contato@alertarastreamento.com.br</p>
              <p className="text-muted-foreground">Telefone: +55 31 3318-8489</p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Ao utilizar nossos serviços, você concorda com estes Termos de Uso.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermosUso;

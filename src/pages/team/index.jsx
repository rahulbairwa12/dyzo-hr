
import Button from "@/components/ui/Button";
import Icons from "@/components/ui/Icon";
import { fetchGET } from "@/store/api/apiSlice";
import { React, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import TeamCard from "@/components/teams/TeamCard";
import CreateTeamModal from "@/components/teams/CreateTeamModal";
import Grid from "@/components/skeleton/Grid";


const Team = () => {
  const userInfo = useSelector(state => state.auth.user);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);

  const fetchTeams = async () => {
    try {
      const { data } = await fetchGET(`${import.meta.env.VITE_APP_DJANGO}/company/${userInfo?.companyId}/teams/list/`)
      if (data) setTeams(data)
    } catch (error) {
      toast.error("Unable to fetch teams")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTeams()
  }, [])

  return (
    <section>
      <div className='flex justify-between items-center'>
        <div className="text-black flex rounded-2 items-center gap-2">
          <Icons icon='mingcute:group-3-line' className='w-7 h-7' />
          <p className="text-black font-normal text-lg flex items-center">Teams</p>
        </div>

        {(userInfo?.isAdmin || userInfo.team_leader) && (
          <div className="flex items-center gap-2">
            <Button text="Create Team" icon="heroicons-outline:plus" className='btn-dark dark:bg-slate-800  h-min text-sm font-normal' onClick={() => setShowAddTeamModal(true)} />
          </div>
        )}
      </div>

      {loading && <Grid />}

      {!loading && (

        (teams.length === 0) ? (
          <p className="text-center capitalize">No teams available</p>
        ) :
          <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5 mt-12'>
            {
              (teams.map(team => (<TeamCard key={team.id} team={team} fetchTeams={fetchTeams} />)))

            }
          </div>
      )}

      {<CreateTeamModal showAddTeamModal={showAddTeamModal} setShowAddTeamModal={setShowAddTeamModal} fetchTeams={fetchTeams} />}

    </section>
  );
};

export default Team;
